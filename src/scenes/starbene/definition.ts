import type { SceneDefinition } from "@/experience/types"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

export const conceptLine = "Toda la posventa en la palma de la mano"

/**
 * Viñeta de segunda línea: Starbene (`03-escenas.md` §4 · T-A30).
 *
 * 3 beats:
 * 1. `equipo` — Equipo de medicina estética en vista explosionada (chasis, cabezal,
 *    pantalla clínica, módulo RF); cada pieza se conecta con las secciones de posventa.
 * 2. `app` — App mobile Starbene+ en `<Phone>` con capas de UI flotantes y HUD táctil.
 * 3. `web` — Vidriera comercial en `<Laptop>` con catálogo de equipos, cursos y métricas.
 */
export const starbene: SceneDefinition = {
  id: "starbene",
  tier: 2,
  chapterId: "starbene",
  load: () => import("./Scene"),
  palette: {
    background: "#0B1124",
    foreground: "#EEF4FF",
    accent: "#4B6BFF",
    accentAlt: "#7CC6B8",
    scheme: "dark",
  },
  thread: {
    shape: "growth",
    color: "#7CC6B8",
    anchors: (p) => {
      const explode = smoothstep(p, 0.08, 0.36)
      const toApp = smoothstep(p, 0.34, 0.64)
      const toWeb = smoothstep(p, 0.66, 0.88)
      const toAgnt = smoothstep(p, 0.84, 1)

      return Array.from({ length: 16 }, (_, i): [number, number, number] => {
        const u = i / 15
        // Beat 1: espiral ascendente que envuelve la vista explosionada del equipo.
        const eqAngle = u * Math.PI * 2.2 + p * 1.6
        const eqRadius = (0.55 + Math.sin(u * Math.PI) * 0.75) * (0.65 + explode * 0.45)
        const eqX = -0.55 + Math.cos(eqAngle) * eqRadius
        const eqY = -1.2 + u * 2.75
        const eqZ = Math.sin(eqAngle) * eqRadius * 0.65

        // Beat 2→3: puente fluido entre el equipo (-0.6), el Phone (0.65) y la Laptop (1.35).
        const bridgeX = -2.2 + u * 4.4
        const bridgeY =
          -0.55 +
          Math.sin(u * Math.PI * 2) * (0.58 - toWeb * 0.16) +
          u * 0.75
        const bridgeZ = Math.cos(u * Math.PI) * 0.45

        const sceneX = eqX + (bridgeX - eqX) * toApp
        const sceneY = eqY + (bridgeY - eqY) * toApp
        const sceneZ = eqZ + (bridgeZ - eqZ) * toApp

        // Handoff hacia la pizarra táctica de AGNT (p=0 en agnt/definition.ts).
        const agntX = -3.2 + u * 6.4
        const agntY = Math.sin(u * Math.PI * 3) * 0.35
        const agntZ = Math.cos(u * Math.PI * 2) * 0.25

        return [
          sceneX + (agntX - sceneX) * toAgnt,
          sceneY + (agntY - sceneY) * toAgnt,
          sceneZ + (agntZ - sceneZ) * toAgnt,
        ]
      })
    },
  },
  beats: [
    {
      id: "equipo",
      range: [0, 0.34],
      label: "Cada pieza del equipo tiene su propia posventa.",
    },
    {
      id: "app",
      range: [0.34, 0.68],
      label: "Capacitación, manuales, recambios y soporte en una sola app.",
    },
    {
      id: "web",
      range: [0.68, 1],
      label: "Del consultorio a la vidriera comercial de equipos y cursos.",
    },
  ],
  fallback: {
    poster: "/posters/greybox/starbene.png",
    posterMobile: "/posters/greybox/starbene-mobile.png",
  },
  budget: {
    maxTriangles: 40000,
    maxDrawCalls: 40,
    maxAssetKB: { desktop: 400, mobile: 200 },
  },
}
