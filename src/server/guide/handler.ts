import { readBody } from "./schema"
import { privateIp, sessionToken } from "./session"

export type GuideEvent =
  | { type: "text"; text: string }
  | { type: "action"; action: Record<string, unknown> }
export type GuideConfig = {
  enabled: boolean
  secret?: string
  primary: string
  fallback: string
}
export type GuideServices = {
  admit: (ip: string, session: string) => Promise<string | null>
  reserve: (body: Awaited<ReturnType<typeof readBody>>) => Promise<boolean>
  generate: (
    model: string,
    body: Awaited<ReturnType<typeof readBody>>,
    signal: AbortSignal
  ) => AsyncIterable<GuideEvent>
}
const contact = { type: "showContact" }
export function createHandler(config: GuideConfig, services: GuideServices) {
  return async (request: Request, ip: string, cookie?: string) => {
    const headers = new Headers({ "Cache-Control": "no-store" })
    const fixed = (status: number, code: string) =>
      Response.json(
        {
          code,
          message:
            "El guía no está disponible ahora. Podés contactar directamente a Gonzalo.",
          action: contact,
        },
        { status, headers }
      )
    if (!config.enabled) return fixed(503, "disabled")
    if (!config.secret || config.secret.length < 32)
      return fixed(503, "configuration")
    if (
      request.headers.get("origin") &&
      request.headers.get("origin") !== new URL(request.url).origin
    )
      return fixed(403, "origin")
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return fixed(415, "content_type")
    let body: Awaited<ReturnType<typeof readBody>>
    try {
      body = await readBody(request)
    } catch {
      return fixed(400, "invalid_request")
    }
    const session = sessionToken(config.secret, cookie)
    headers.set(
      "Set-Cookie",
      `guide_session=${session.token}; Path=/api/guide; HttpOnly; SameSite=Strict; Max-Age=86400${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`
    )
    try {
      const limit = await services.admit(
        privateIp(config.secret, ip),
        session.id
      )
      if (limit === "disabled") return fixed(503, "disabled")
      if (limit) {
        headers.set("Retry-After", limit === "session" ? "86400" : "3600")
        return fixed(429, limit)
      }
      if (!(await services.reserve(body))) return fixed(429, "budget")
    } catch {
      return fixed(503, "limits_unavailable")
    }

    headers.set("Content-Type", "text/event-stream; charset=utf-8")
    headers.set("X-Accel-Buffering", "no")
    const abort = new AbortController()
    const signal = AbortSignal.any([request.signal, abort.signal])
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: object) =>
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
          )
        let emitted = false
        try {
          for (const [index, model] of [
            config.primary,
            config.fallback,
          ].entries()) {
            try {
              const attemptSignal = AbortSignal.any([
                signal,
                AbortSignal.timeout(12000),
              ])
              for await (const event of services.generate(
                model,
                body,
                attemptSignal
              )) {
                if (signal.aborted) throw new Error("aborted")
                emitted = true
                send(event)
              }
              if (!emitted) throw new Error("empty_response")
              send({ type: "done" })
              return
            } catch {
              if (signal.aborted) return
              if (emitted || index === 1 || !(await services.reserve(body)))
                throw new Error("generation")
            }
          }
        } catch {
          if (!signal.aborted)
            send({
              type: "error",
              code: "unavailable",
              message: "Podés contactar directamente a Gonzalo.",
              action: contact,
            })
        } finally {
          if (!signal.aborted) controller.close()
        }
      },
      cancel() {
        abort.abort()
      },
    })
    return new Response(stream, { headers })
  }
}
