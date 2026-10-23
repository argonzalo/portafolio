/** One scroll interval for camera, scenery, captions, palette and thread. */
export const HANDOFF_START = 0.86

/** La entrada de la cancha tiene más recorrido; las demás escenas conservan
 * su ritmo. Hilo, cámara, paleta y captions comparten el mismo intervalo. */
export function handoffStart(chapterId?: string | null): number {
  return chapterId === "manifesto" ? 0.78 : HANDOFF_START
}

export function ease(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function ramp(p: number, start: number, end: number): number {
  return ease((p - start) / (end - start))
}

export function handoff(progress: number, chapterId?: string | null): number {
  return ramp(progress, handoffStart(chapterId), 1)
}

/** Hold a readable beat, with a soft, reversible entrance and exit. */
export function envelope(p: number, start: number, end = 2, width = 0.045) {
  return ramp(p, start, start + width) * (1 - ramp(p, end - width, end))
}
