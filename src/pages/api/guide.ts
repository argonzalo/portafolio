import type { APIRoute } from "astro"
import {
  GUIDE_ENABLED,
  GUIDE_SESSION_SECRET,
  GUIDE_DAILY_BUDGET_USD,
  OPEN_AI_API_KEY,
  OPEN_AI_MODEL,
  OPEN_AI_MODEL_FALLBACK,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
} from "astro:env/server"
import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"
import { guideContext } from "../../server/guide/context"
import { guideTools } from "../../server/guide/tools"
import { createLimits, estimateMicroUsd } from "../../server/guide/limits"
import { createHandler } from "../../server/guide/handler"

export const prerender = false
export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const configured = Boolean(
    OPEN_AI_API_KEY && UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
  )
  const limits = configured
    ? createLimits(
        UPSTASH_REDIS_REST_URL!,
        UPSTASH_REDIS_REST_TOKEN!,
        GUIDE_DAILY_BUDGET_USD ?? 5
      )
    : undefined
  let prepared: Awaited<ReturnType<typeof guideContext>> | undefined
  const handle = createHandler(
    {
      enabled: GUIDE_ENABLED ?? false,
      secret: configured ? GUIDE_SESSION_SECRET : undefined,
      primary: OPEN_AI_MODEL ?? "gpt-6-luna",
      fallback: OPEN_AI_MODEL_FALLBACK ?? "gpt-5.4-mini",
    },
    {
      admit: async (ip, session) => {
        if (!limits) throw new Error("configuration")
        return limits.admit(ip, session)
      },
      reserve: async (body) => {
        prepared ??= await guideContext(body.chapterId, body.beatId)
        return (
          limits?.reserve(
            estimateMicroUsd(
              prepared.system +
                JSON.stringify(body.history.slice(-12)) +
                body.message
            )
          ) ?? false
        )
      },
      async *generate(model, body, signal) {
        const context =
          prepared ?? (await guideContext(body.chapterId, body.beatId))
        const tools = guideTools(context.projects.map((p) => p.id))
        const result = streamText({
          model: createOpenAI({ apiKey: OPEN_AI_API_KEY })(model),
          system: context.system,
          messages: [
            ...body.history.slice(-12),
            { role: "user", content: body.message },
          ],
          maxOutputTokens: 250,
          maxRetries: 0,
          abortSignal: signal,
          providerOptions: { openai: { store: false } },
          tools,
        })
        for await (const part of result.stream) {
          if (part.type === "error") throw new Error("provider")
          if (part.type === "text-delta")
            yield { type: "text", text: part.text }
          if (
            part.type === "tool-call" &&
            !part.invalid &&
            !part.dynamic &&
            part.toolName in tools &&
            typeof part.input === "object" &&
            part.input !== null
          ) {
            yield {
              type: "action",
              action: { ...part.input, type: part.toolName },
            }
          }
        }
      },
    }
  )
  return handle(request, clientAddress, cookies.get("guide_session")?.value)
}
