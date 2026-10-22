import type { SceneDefinition } from "@/experience/types"

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
    anchors: () => [
      [-4, 0.05, 2],
      [-2, 1.5, 0],
      [0, 2, -1],
      [3, 0.15, -3],
    ],
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
