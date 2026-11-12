/** One scroll interval for camera, scenery, captions, palette and thread. */
export const HANDOFF_START = 0.86

/** La entrada de la cancha tiene más recorrido. Las frases terminan de
 * asentarse antes del relevo; hilo, cámara, paleta y captions comparten fase. */
export function handoffStart(chapterId?: string | null): number {
  return chapterId === "manifesto" ? 0.6 : HANDOFF_START
}

export function ease(value: number): number {
  const t = Math.max(0, Math.min(1, value))
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export function ramp(p: number, start: number, end: number): number {
  return ease((p - start) / (end - start))
}

export function handoff(progress: number, chapterId?: string | null): number {
  const start = handoffStart(chapterId)
  if (chapterId === "manifesto") {
    const t = Math.max(0, Math.min(1, (progress - start) / (1 - start)))
    return t * t * (3 - 2 * t)
  }
  return ramp(progress, start, 1)
}

/** Hold a readable beat, with a soft, reversible entrance and exit. */
export function envelope(p: number, start: number, end = 2, width = 0.045) {
  return ramp(p, start, start + width) * (1 - ramp(p, end - width, end))
}

/** Oculta la sustitución del copy en el límite de cada beat. El texto saliente
 * se apaga antes del cambio y el entrante reaparece después, también al volver.
 */
export function beatCopyOpacity(p: number, count: number, width = 0.025) {
  const beat = Math.min(count - 1, Math.max(0, Math.floor(p * count)))
  const start = beat / count
  const end = (beat + 1) / count
  return (
    (beat === 0 ? 1 : ramp(p, start, start + width)) *
    (beat === count - 1 ? 1 : 1 - ramp(p, end - width, end))
  )
}
