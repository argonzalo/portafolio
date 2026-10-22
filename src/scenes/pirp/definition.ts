import type { SceneDefinition } from "../../experience/types"

export const pirp: SceneDefinition = {
  id: "pirp",
  tier: 1,
  chapterId: "pirp",
  load: () => import("./Scene"),
  palette: {
    background: "#17181A",
    foreground: "#EFE9DD",
    accent: "#7A1F2B",
    accentAlt: "#A8434F",
    scheme: "dark",
  },
  thread: {
    shape: "custom",
    color: "#7A1F2B",
    anchors: (p) =>
      Array.from({ length: 18 }, (_, i) => {
        const x = (i / 17 - 0.5) * 7
        return [
          x,
          Math.sin(i * 1.3 + p * 12) * (0.12 + Math.sin(p * Math.PI) * 0.5),
          0,
        ]
      }),
  },
  beats: [
    { id: "mundo", range: [0, 0.2], label: "Una señal que late" },
    { id: "problema", range: [0.2, 0.4], label: "El ruido se multiplica" },
    {
      id: "razonamiento",
      range: [0.4, 0.6],
      label: "Cada señal encuentra su tema",
    },
    {
      id: "solucion",
      range: [0.6, 0.8],
      label: "Una tendencia se vuelve alerta",
    },
    { id: "resultado", range: [0.8, 1], label: "Del ruido a la estrategia" },
  ],
  fallback: {
    poster: "/posters/greybox/pirp.png",
    posterMobile: "/posters/greybox/pirp-mobile.png",
  },
  budget: {
    maxTriangles: 20000,
    maxDrawCalls: 55,
    maxAssetKB: { desktop: 200, mobile: 150 },
  },
}
