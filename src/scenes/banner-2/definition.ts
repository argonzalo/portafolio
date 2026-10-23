import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

export const banner: SceneDefinition = {
  id: "banner-2",
  tier: 1,
  chapterId: "banner-2",
  load: () => import("./Scene"),
  palette: {
    background: "#151211",
    foreground: "#fff0e9",
    accent: "#FFB5A0",
    accentAlt: "#BDC2FF",
    scheme: "dark",
  },
  thread: {
    shape: "split",
    color: "#FFB5A0",
    anchors: (p) => {
      // La señal pasa por debajo de las superficies: no tapa la interfaz ni el mapa.
      const toVignette = smoothstep(p, 0.86, 1)
      const y = -3.9 * (1 - toVignette)
      return [
        [-5, y - 0.15, -1],
        [-2.5, y + 0.1, -1],
        [0, y, -1],
        [2.5, y + 0.1, -1],
        [5, y - 0.15, -1],
      ]
    },
  },
  beats: [
    {
      id: "mundo",
      range: [0, 1],
      label: "Todas tus pantallas, un solo control",
    },
  ],
  fallback: {
    poster: "/posters/banner-2.webp",
    posterMobile: "/posters/banner-2-mobile.webp",
  },
  budget: {
    maxTriangles: 50000,
    maxDrawCalls: 40,
    maxAssetKB: { desktop: 1200, mobile: 600 },
  },
}
