/**
 * Lectura de partido completo (60 min) para la tarjeta de resultado.
 * Curado a mano siguiendo el reporte de la landing de Vibo: `data.ts` solo
 * cubre un punto real, así que estas series son ilustrativas.
 */

export const MATCH_MINUTES = 60

/** Perfil físico-táctico, 0..1 (radar). */
export const STYLE = [
  { label: "Velocidad", value: 0.68 },
  { label: "Resistencia", value: 0.74 },
  { label: "Explosividad", value: 0.58 },
  { label: "Cobertura", value: 0.66 },
  { label: "Aceleración", value: 0.82 },
] as const

/** Manchas del mapa de calor en [x, y, radio, peso], red arriba y fondo abajo. */
export const HEAT_BLOBS: readonly { x: number; y: number; r: number; w: number; tone: "blue" | "light" }[] = [
  { x: 28, y: 78, r: 22, w: 0.95, tone: "light" },
  { x: 62, y: 84, r: 18, w: 0.7, tone: "blue" },
  { x: 40, y: 50, r: 20, w: 0.62, tone: "blue" },
  { x: 58, y: 34, r: 16, w: 0.48, tone: "blue" },
  { x: 30, y: 16, r: 14, w: 0.42, tone: "blue" },
]

/** Intensidad relativa por minuto (1 = pico del partido). */
export const WEAR: readonly number[] = Array.from({ length: MATCH_MINUTES + 1 }, (_, m) => {
  const trend = 0.86 - 0.22 * (m / MATCH_MINUTES) ** 1.4
  const rhythm = 0.06 * Math.sin(m / 4.4) + 0.015 * Math.sin(m / 1.7 + 1)
  return Math.min(1, Math.max(0.2, trend + rhythm))
})

/** Caída de intensidad entre el primer y el último cuarto, en %. */
export const WEAR_DROP = (() => {
  const q = Math.round(MATCH_MINUTES / 4)
  const avg = (a: readonly number[]) => a.reduce((s, v) => s + v, 0) / a.length
  return Math.round((1 - avg(WEAR.slice(-q)) / avg(WEAR.slice(0, q))) * 100)
})()
