import { ramp } from "@/experience/choreography"

/** Day/night blend of the baked room atlases. */
export function nightMix(p: number) {
  return ramp(p, 0.59, 0.67) * (1 - ramp(p, 0.78, 0.855))
}

/** Blend the room into the page as the camera approaches the work desk. */
export function readingVeil(p: number) {
  return ramp(p, 0.29, 0.4) * (1 - ramp(p, 0.78, 0.855))
}

/** Same endpoints as the six travelling leaves; seeking backwards is identical. */
export function arrivalPulse(p: number) {
  let pulse = 0
  for (let i = 0; i < 6; i++) {
    const arrival = 0.54 + i * 0.012
    pulse +=
      ramp(p, arrival - 0.009, arrival) *
      (1 - ramp(p, arrival, arrival + 0.026))
  }
  return Math.min(1, pulse * 0.65)
}
