import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

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
    anchors: (p) => {
      // Conecta el tallo de la planta con los dispositivos en razonamiento
      // y prepara el conducto diagonal de entrada de Banner 2.0 en el cierre.
      const connect = smoothstep(p, 0.28, 0.65)
      const toBanner = smoothstep(p, 0.82, 1)

      return Array.from({ length: 18 }, (_, i): [number, number, number] => {
        const u = i / 17
        const stemX = -2.8 + Math.sin(u * Math.PI) * 0.25
        const stemY = -1.5 + u * (2.8 + p * 0.4)

        // Arco orgánico hacia el teléfono y el escritorio de Natuadmin.
        const bridgeX = stemX + u * connect * 4.6
        const bridgeY =
          stemY * (1 - connect * 0.45) +
          Math.sin(u * Math.PI) * connect * 0.65
        const bridgeZ = Math.sin(u * Math.PI) * connect * 0.75

        // Entrada de Banner 2.0 (p=0 en banner-2/definition.ts).
        const bannerX = -4 + u * 8
        const bannerY = u < 0.5 ? -2 + u * 4 : 0
        const bannerZ = 1

        return [
          bridgeX + (bannerX - bridgeX) * toBanner,
          bridgeY + (bannerY - bridgeY) * toBanner,
          bridgeZ + (bannerZ - bridgeZ) * toBanner,
        ]
      })
    },
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
