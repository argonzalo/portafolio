import type { SceneDefinition } from "@/experience/types"

export const banner: SceneDefinition = {
  id: "banner-2",
  tier: 1,
  chapterId: "banner-2",
  load: () => import("./Scene"),
  palette: {
    background: "#151211",
    foreground: "#fff0e9",
    accent: "#DA3E00",
    accentAlt: "#FFB5A0",
    scheme: "dark",
  },
  thread: {
    shape: "split",
    color: "#FFB5A0",
    anchors: (p) => [
      [-4, -2, 1],
      [-2, -1, 1],
      [0, 0, 1],
      [1.8, p > 0.6 ? 1.2 : 0, 1],
      [4, p > 0.6 ? -1 : 0, 1],
    ],
  },
  beats: [
    { id: "mundo", range: [0, 0.2], label: "Una pantalla en la oscuridad" },
    {
      id: "problema",
      range: [0.2, 0.4],
      label: "Cientos de mensajes sin coordinar",
    },
    {
      id: "razonamiento",
      range: [0.4, 0.6],
      label: "Una plantilla, reglas precisas",
    },
    { id: "solucion", range: [0.6, 0.8], label: "Publicar a escala" },
    { id: "resultado", range: [0.8, 1], label: "≈10.000 equipos activos" },
  ],
  fallback: {
    poster: "/posters/greybox/banner-2.png",
    posterMobile: "/posters/greybox/banner-2-mobile.png",
  },
  budget: {
    maxTriangles: 65000,
    maxDrawCalls: 85,
    maxAssetKB: { desktop: 50, mobile: 50 },
  },
}
