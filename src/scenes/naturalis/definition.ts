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
        const stemX = Math.sin(u * Math.PI) * 0.1
        const stemY = -1.1 + u * (2.1 + p * 0.2)

        // Arco orgánico hacia el teléfono y el escritorio de Natuadmin.
        const bridgeX = stemX + u * connect * 2.8
        const bridgeY =
          stemY * (1 - connect) + (-0.9 + Math.sin(u * Math.PI) * 0.3) * connect
        const bridgeZ = 1.26 + Math.sin(u * Math.PI) * connect * 0.3

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
    poster: "/posters/naturalis/desktop.webp",
    posterMobile: "/posters/naturalis/mobile.webp",
  },
  budget: {
    maxTriangles: 32000,
    maxDrawCalls: 100,
    maxAssetKB: { desktop: 1500, mobile: 600 },
  },
}
