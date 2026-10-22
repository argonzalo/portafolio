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

/** Grilla del mapa de calor: 8 columnas (ancho) × 10 filas (red → fondo). */
export const HEAT_COLS = 8
export const HEAT_ROWS = 10

const BLOBS: readonly [x: number, y: number, r: number, w: number][] = [
  [5.4, 7.6, 1.7, 1],
  [4.2, 5.2, 1.6, 0.55],
  [3.6, 1.6, 1.3, 0.38],
  [6.4, 8.8, 1.1, 0.5],
]

export const MATCH_HEAT: readonly number[] = (() => {
  const cells: number[] = []
  for (let row = 0; row < HEAT_ROWS; row++)
    for (let col = 0; col < HEAT_COLS; col++) {
      let v = 0
      for (const [x, y, r, w] of BLOBS)
        v += w * Math.exp(-((col + 0.5 - x) ** 2 + (row + 0.5 - y) ** 2) / (r * r))
      cells.push(v)
    }
  const max = Math.max(...cells)
  return cells.map((v) => v / max)
})()

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
