import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// Atomic reservation prevents concurrent requests from overshooting the budget.
// Conservative admission estimate, not a provider invoice; recalibrate in T-A28.
export const reserveScript = `
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local amount = tonumber(ARGV[1])
if used + amount > tonumber(ARGV[2]) then return 0 end
redis.call('INCRBY', KEYS[1], amount)
redis.call('EXPIRE', KEYS[1], 172800)
return 1`

export function estimateMicroUsd(input: string) {
  // One token per UTF-8 byte plus framing/tool overhead is deliberately conservative.
  // Planning rates: USD 10/M input, USD 40/M output; verify both models in T-A28.
  return (Buffer.byteLength(input, "utf8") + 2048) * 10 + 250 * 40
}

export function createLimits(
  url: string,
  token: string,
  budget: number,
  namespace = "guide"
) {
  const redis = new Redis({ url, token })
  const limiter = (count: number, window: "1 h" | "1 d", prefix: string) =>
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(count, window),
      prefix: `${namespace}:${prefix}`,
      analytics: false,
      timeout: 0,
      ephemeralCache: false,
    })
  const hourly = limiter(30, "1 h", "hour")
  const daily = limiter(60, "1 d", "day")
  return {
    async admit(ip: string, session: string) {
      if ((await redis.get(`${namespace}:enabled`)) === false) return "disabled"
      const results = await Promise.all([hourly.limit(ip), daily.limit(ip)])
      await Promise.all(results.map((r) => r.pending))
      if (results.some((r) => !r.success)) return "ip"
      const count = await redis.eval<[], number>(
        `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], 86400) end; return n`,
        [`${namespace}:session:${session}`],
        []
      )
      return count <= 12 ? null : "session"
    },
    async reserve(microUsd: number) {
      if (!Number.isFinite(budget) || budget <= 0) return false
      if (!Number.isSafeInteger(microUsd) || microUsd <= 0) return false
      return (
        (await redis.eval<number[], number>(
          reserveScript,
          [`${namespace}:budget:${new Date().toISOString().slice(0, 10)}`],
          [microUsd, Math.floor(budget * 1000000)]
        )) === 1
      )
    },
  }
}
