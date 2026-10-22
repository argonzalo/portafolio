import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

export const conceptLine = "La calma del Caribe, en una vidriera"

/**
 * Viñeta de segunda línea: Cielo y Mar (`03-escenas.md` §4 · T-A32).
 *
 * 3 beats:
 * 1. `mar` — Agua con shader de mar al atardecer, reflejo solar y brisa cálida.
 * 2. `suite` — La suite aparece como una postal arquitectónica flotante sobre el horizonte.
 * 3. `sitio` — La postal se convierte en el sitio web dentro de una `<Laptop>` con capas de UI.
 */
export const cieloYMar: SceneDefinition = {
  id: "cielo-y-mar",
  tier: 2,
  chapterId: "cielo-y-mar",
  load: () => import("./Scene"),
  palette: {
    background: "#0B1E2D",
    foreground: "#FFF8F0",
    accent: "#16B5A8",
    accentAlt: "#F4A261",
    scheme: "dark",
  },
  thread: {
    shape: "line",
    color: "#F4A261",
    anchors: (p) => {
      const suiteRise = smoothstep(p, 0.26, 0.62)
      const toArchive = smoothstep(p, 0.84, 1)

      return Array.from({ length: 16 }, (_, i): [number, number, number] => {
        const u = i / 15
        // Onda serena en la orilla inferior para no cruzar el centro de los dispositivos
        const waveX = -3.6 + u * 7.2
        const waveY =
          -0.68 +
          Math.sin(u * Math.PI * 2 + p * 2.4) * 0.08 * (1 - suiteRise * 0.4)
        const waveZ = 0.55 * (1 - toArchive)

        // Handoff hacia la línea horizontal limpia del Archivo 2D
        const archiveX = (u * 2 - 1) * 3.6
        const archiveY = 0
        const archiveZ = 0

        return [
          waveX + (archiveX - waveX) * toArchive,
          waveY + (archiveY - waveY) * toArchive,
          waveZ + (archiveZ - waveZ) * toArchive,
        ]
      })
    },
  },
  beats: [
    {
      id: "mar",
      range: [0, 0.34],
      label: "El horizonte del Caribe al caer el sol.",
    },
    {
      id: "suite",
      range: [0.34, 0.68],
      label: "Cada suite se presenta como una postal lista para habitar.",
    },
    {
      id: "sitio",
      range: [0.68, 1],
      label: "De la calma de Playa del Carmen a una vidriera digital que invita a reservar.",
    },
  ],
  fallback: {
    poster: "/posters/greybox/cielo-y-mar.png",
    posterMobile: "/posters/greybox/cielo-y-mar-mobile.png",
  },
  budget: {
    maxTriangles: 40000,
    maxDrawCalls: 40,
    maxAssetKB: { desktop: 400, mobile: 200 },
  },
}
