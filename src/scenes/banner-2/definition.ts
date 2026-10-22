import type { SceneBorderFrames } from "@/experience/thread/forms"
import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

/** Encuadres de borde para continuidad de cámara Naturalis → Banner → Segunda línea (T-A41). */
export const bannerBorderFrames: SceneBorderFrames = {
  // Coincide exactamente con `naturalisBorderFrames.exit`.
  entry: {
    desktop: [2.4, 1.5, 9.4],
    mobile: [1.8, 2.1, 13.4],
    target: [0, 0.25, 0],
    mobileTarget: [-0.2, 0.1, 0],
  },
  exit: {
    desktop: [0, 0.2, 6.2],
    mobile: [0, 0.25, 7.5],
    target: [0, 0, 0],
  },
  entrySpan: 0.08,
  exitStart: 0.9,
}

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
    anchors: (p) => {
      // Bifurcación continua (sin escalón brusco en p=0.6) y cierre hacia segunda línea.
      const split =
        smoothstep(p, 0.42, 0.72) * (1 - smoothstep(p, 0.85, 1) * 0.55)
      const toVignette = smoothstep(p, 0.84, 1)

      return [
        [-4, -2 * (1 - toVignette * 0.7), 1 - toVignette],
        [-2, -1 * (1 - toVignette * 0.7), 1 - toVignette],
        [0, 0, 1 - toVignette],
        [1.8, split * 1.2, 1 - toVignette],
        [4, -split * 1.0, 1 - toVignette],
      ]
    },
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
