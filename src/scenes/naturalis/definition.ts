import type { SceneDefinition } from "@/experience/types"

export const naturalis: SceneDefinition = {
  id: "naturalis",
  tier: 1,
  chapterId: "naturalis",
  load: () => import("./Scene"),
  palette: {
    background: "#FAFDFC",
    foreground: "#26463F",
    accent: "#56857D",
    accentAlt: "#81AAA4",
    scheme: "light",
  },
  thread: {
    shape: "growth",
    color: "#56857D",
    anchors: (p) => [
      [-2.8, -1.5, 0],
      [-2.8, -0.7 + p * 0.8, 0],
      [-2.5, 0.2 + p * 0.8, 0],
      [-2.7, 1.3 + p * 0.4, 0],
    ],
  },
  beats: [
    { id: "mundo", range: [0, 0.2], label: "Un espacio para cuidar" },
    { id: "problema", range: [0.2, 0.4], label: "Una agenda que pide calma" },
    {
      id: "razonamiento",
      range: [0.4, 0.6],
      label: "Clientes y equipo conectados",
    },
    { id: "solucion", range: [0.6, 0.8], label: "Mientras el equipo descansa" },
    { id: "resultado", range: [0.8, 1], label: "Orden sin esfuerzo" },
  ],
  fallback: {
    poster: "/posters/greybox/naturalis.png",
    posterMobile: "/posters/greybox/naturalis-mobile.png",
  },
  budget: {
    maxTriangles: 18000,
    maxDrawCalls: 100,
    maxAssetKB: { desktop: 1500, mobile: 600 },
  },
}
