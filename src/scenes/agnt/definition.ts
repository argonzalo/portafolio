import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

export const conceptLine = "El mercado de pases, ordenado"

/**
 * Viñeta de segunda línea: AGNT (`03-escenas.md` §4 · T-A31).
 *
 * 3 beats:
 * 1. `pizarra` — Pizarra táctica 3D con formación de jugadores y clubes como nodos.
 * 2. `traspasos` — Arcos de traspasos entre clubes y pulsos de sincronización con API-Football.
 * 3. `panel` — Plataforma AGNT en `<Display>` y `<Laptop>` con fichas de jugador y órdenes en vivo.
 */
export const agnt: SceneDefinition = {
  id: "agnt",
  tier: 2,
  chapterId: "agnt",
  load: () => import("./Scene"),
  palette: {
    background: "#0B1513",
    foreground: "#EAF7F3",
    accent: "#38C898",
    accentAlt: "#6EA8FE",
    scheme: "dark",
  },
  thread: {
    shape: "branching",
    color: "#6EA8FE",
    anchors: (p) => {
      const arcs = smoothstep(p, 0.28, 0.65)
      const toCielo = smoothstep(p, 0.84, 1)

      return Array.from({ length: 16 }, (_, i): [number, number, number] => {
        const u = i / 15
        // Arco táctico entre nodos de clubes sobre la pizarra
        const boardX = -3.1 + u * 6.2
        const arch =
          Math.sin(u * Math.PI) * (0.45 + arcs * 0.95) +
          Math.sin(u * Math.PI * 3 + p * 4) * 0.16 * (1 - arcs * 0.4)
        const boardY = -0.35 + arch
        const boardZ = Math.cos(u * Math.PI * 2) * 0.48 * (1 - toCielo * 0.6)

        // Handoff hacia el horizonte marino de Cielo y Mar (p=0 en cielo-y-mar/definition.ts)
        const seaX = -3.4 + u * 6.8
        const seaY = -0.35 + Math.sin(u * Math.PI * 2) * 0.18
        const seaZ = 0.25

        return [
          boardX + (seaX - boardX) * toCielo,
          boardY + (seaY - boardY) * toCielo,
          boardZ + (seaZ - boardZ) * toCielo,
        ]
      })
    },
  },
  beats: [
    {
      id: "pizarra",
      range: [0, 0.34],
      label: "Jugadores, clubes y representantes en una misma pizarra.",
    },
    {
      id: "traspasos",
      range: [0.34, 0.68],
      label: "Cada traspaso traza su ruta con datos vigentes de las APIs de fútbol.",
    },
    {
      id: "panel",
      range: [0.68, 1],
      label: "Del seguimiento del mercado a la operación cerrada.",
    },
  ],
  fallback: {
    poster: "/posters/greybox/agnt.png",
    posterMobile: "/posters/greybox/agnt-mobile.png",
  },
  budget: {
    maxTriangles: 40000,
    maxDrawCalls: 40,
    maxAssetKB: { desktop: 400, mobile: 200 },
  },
}
