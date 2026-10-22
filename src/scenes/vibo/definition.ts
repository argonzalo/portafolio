import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

export const conceptLine = "Ver lo invisible del juego"

export const vibo: SceneDefinition = {
  id: "vibo",
  tier: 1,
  chapterId: "vibo",
  load: () => import("./Scene"),
  palette: {
    background: "#071426",
    foreground: "#edf5ff",
    accent: "#408dff",
    accentAlt: "#f5c451",
    scheme: "dark",
  },
  thread: {
    shape: "trajectory",
    color: "#f5c451",
    anchors: (p) => {
      const strike = smoothstep(p, 0.15, 0.52)
      const overhead = smoothstep(p, 0.56, 0.74) * (1 - smoothstep(p, 0.78, 0.92))
      const toPirp = smoothstep(p, 0.82, 1)

      return Array.from({ length: 18 }, (_, i): [number, number, number] => {
        const u = i / 17
        // Trayectoria de pelota en Vibo: golpe alto + pique en u=0.64.
        const viboX = -4 + u * 7
        const arc =
          u < 0.64
            ? -12.5 * (u - 0.32) ** 2 + (1.35 + strike * 0.85)
            : 0.12 + 0.95 * (1 - ((u - 0.82) / 0.18) ** 2)
        const viboY = Math.max(0.05, arc) * (1 - overhead * 0.35)
        const viboZ = (2 - u * 5) * (1 - overhead * 0.2)

        // Handoff hacia la señal inicial de Pirp (p=0 en pirp/definition.ts).
        const pirpX = (u - 0.5) * 7
        const pirpY = Math.sin(i * 1.3) * 0.12
        const pirpZ = 0

        return [
          viboX + (pirpX - viboX) * toPirp,
          viboY + (pirpY - viboY) * toPirp,
          viboZ + (pirpZ - viboZ) * toPirp,
        ]
      })
    },
  },
  beats: [
    {
      id: "mundo",
      range: [0, 0.2],
      label: "Una cancha. Otra forma de ver el juego.",
    },
    {
      id: "razonamiento",
      range: [0.2, 0.58],
      label: "El golpe revela lo que el video no explica.",
    },
    {
      id: "solucion",
      range: [0.58, 0.8],
      label: "De cada movimiento a una lectura de la cancha.",
    },
    {
      id: "resultado",
      range: [0.8, 1],
      label: "Entender cómo jugás para saber qué mejorar.",
    },
  ],
  fallback: {
    poster: "/posters/greybox/vibo.png",
    posterMobile: "/posters/greybox/vibo-mobile.png",
  },
  budget: {
    maxTriangles: 100000,
    maxDrawCalls: 100,
    maxAssetKB: { desktop: 1500, mobile: 600 },
  },
}
