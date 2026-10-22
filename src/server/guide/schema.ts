import { z } from "zod"

export const requestSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().max(1500),
          })
          .strict()
      )
      .max(40)
      .default([]),
    chapterId: z.string().max(80).optional(),
    beatId: z.string().max(80).optional(),
  })
  .strict()

/** Bound the stream itself; Content-Length alone is controlled by the caller. */
export async function readBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new Error("body")
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 24000) {
        await reader.cancel()
        throw new Error("size")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return requestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")))
}
