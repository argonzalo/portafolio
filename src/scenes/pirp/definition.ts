import type { SceneDefinition } from "../../experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

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
    anchors: (p) => {
      // En beat 5 ("el ruido se calma") la señal converge al tallo inicial de Naturalis.
      const toNaturalis = smoothstep(p, 0.82, 1)

      return Array.from({ length: 18 }, (_, i): [number, number, number] => {
        const u = i / 17
        const waveX = (u - 0.5) * 7
        const waveAmp = (0.12 + Math.sin(p * Math.PI) * 0.5) * (1 - toNaturalis * 0.85)
        const waveY = Math.sin(i * 1.3 + p * 12) * waveAmp

        // Tallo orgánico de entrada en Naturalis (p=0 en naturalis/definition.ts).
        const stemX = -2.8 + Math.sin(u * Math.PI) * 0.25
        const stemY = -1.5 + u * 2.8

        return [
          waveX + (stemX - waveX) * toNaturalis,
          waveY + (stemY - waveY) * toNaturalis,
          0,
        ]
      })
    },
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
