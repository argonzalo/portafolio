import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"

const lifetime = 86400
export function sessionToken(secret: string, value?: string, now = Date.now()) {
  const sign = (payload: string) =>
    createHmac("sha256", secret).update(payload).digest("base64url")
  if (value) {
    const [id, expiry, signature, extra] = value.split(".")
    const payload = `${id}.${expiry}`
    const expected = Buffer.from(sign(payload))
    const supplied = Buffer.from(signature ?? "")
    if (
      !extra &&
      /^[a-f0-9-]{36}$/.test(id) &&
      Number(expiry) > now / 1000 &&
      Number(expiry) <= now / 1000 + lifetime &&
      expected.length === supplied.length &&
      timingSafeEqual(expected, supplied)
    ) {
      return { id, token: value }
    }
  }
  const id = randomUUID()
  const payload = `${id}.${Math.floor(now / 1000) + lifetime}`
  return { id, token: `${payload}.${sign(payload)}` }
}

export function privateIp(secret: string, ip: string) {
  return createHmac("sha256", secret).update(ip).digest("hex")
}
