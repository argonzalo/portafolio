import { test } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import { createLimits, estimateMicroUsd } from "./limits.ts"

test("budget estimate grows with input bytes", () => {
  assert.ok(
    estimateMicroUsd("á".repeat(500)) > estimateMicroUsd("a".repeat(500))
  )
})
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
test(
  "real Redis: concurrent budget, session, IP windows and runtime kill switch",
  { skip: !url || !token },
  async () => {
    const namespace = `guide-test:${randomUUID()}`
    const redis = new Redis({ url, token })
    const limits = createLimits(url, token, 0.01, namespace)
    try {
      const reservations = await Promise.all(
        Array.from({ length: 20 }, () => limits.reserve(1000))
      )
      assert.equal(reservations.filter(Boolean).length, 10)
      const sessions = await Promise.all(
        Array.from({ length: 13 }, (_, i) =>
          limits.admit(`session-ip-${i}`, "same-session")
        )
      )
      assert.equal(sessions.filter((value) => value === "session").length, 1)
      for (const [window, count, prefix] of [
        ["1 h", 30, "hour"],
        ["1 d", 60, "day"],
      ]) {
        const seed = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(count, window),
          prefix: `${namespace}:${prefix}`,
          analytics: false,
          timeout: 0,
          ephemeralCache: false,
        })
        const result = await seed.limit(prefix, { rate: count })
        await result.pending
        assert.equal(await limits.admit(prefix, `session-${prefix}`), "ip")
      }
      await redis.set(`${namespace}:enabled`, false)
      assert.equal(await limits.admit("fresh", "fresh"), "disabled")
    } finally {
      const keys = await redis.keys(`${namespace}:*`)
      if (keys.length) await redis.del(...keys)
    }
  }
)
