import type { SceneDefinition } from "@/experience/types"
import {
  HERO_TRAIL,
  courtOutline,
  heroHalo,
  samplePath,
  type Vec3,
} from "./world"

function smoothstep(value: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return t * t * (3 - 2 * t)
}

export const conceptLine = "Ver lo invisible del juego"

const THREAD_POINTS = 18
const OUTLINE = courtOutline(THREAD_POINTS)
const HALO = heroHalo(THREAD_POINTS)
const TRAIL = samplePath(
  (t) => {
    const index = t * (HERO_TRAIL.length - 1)
    const a = HERO_TRAIL[Math.floor(index)]
    const b = HERO_TRAIL[Math.min(HERO_TRAIL.length - 1, Math.floor(index) + 1)]
    const f = index % 1
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1],
      a[2] + (b[2] - a[2]) * f,
    ] as Vec3
  },
  THREAD_POINTS
)

function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}

export const vibo: SceneDefinition = {
  id: "vibo",
  tier: 1,
  chapterId: "vibo",
  load: () => import("./Scene"),
  palette: {
    background: "#071426",
    foreground: "#edf5ff",
    accent: "#1f7aff",
    accentAlt: "#cfd2d6",
    scheme: "dark",
  },
  thread: {
    shape: "trajectory",
    color: "#cfd2d6",
    anchors: (p) => {
      // Mundo: el hilo recorre las líneas de la cancha. Razonamiento: se cierra
      // en el área de detección del jugador. Solución: el recorrido real del
      // jugador A. Resultado: se tensa hacia la señal inicial de Pirp.
      const toBall = smoothstep(p, 0.17, 0.27)
      const toTrail = smoothstep(p, 0.57, 0.66)
      const toPirp = smoothstep(p, 0.82, 1)

      return Array.from({ length: THREAD_POINTS }, (_, i): Vec3 => {
        const u = i / (THREAD_POINTS - 1)
        let point = mix(OUTLINE[i], HALO[i], toBall)
        point = mix(point, TRAIL[i], toTrail)
        // Señal inicial de Pirp (p=0 en pirp/definition.ts).
        const pirp: Vec3 = [(u - 0.5) * 7, Math.sin(i * 1.3) * 0.12, 0]
        return mix(point, pirp, toPirp)
      })
    },
  },
  beats: [
    {
      id: "mundo",
      range: [0, 0.2],
      label: "Una cancha de noche. Otra forma de ver el juego.",
    },
    {
      id: "razonamiento",
      range: [0.2, 0.58],
      label: "El golpe revela lo que el video no explica.",
    },
    {
      id: "solucion",
      range: [0.58, 0.8],
      label: "De cada movimiento, una lectura de la cancha.",
    },
    {
      id: "resultado",
      range: [0.8, 1],
      label: "Entender cómo jugás para saber qué mejorar.",
    },
  ],
  fallback: {
    poster: "/posters/greybox/vibo.png",
    posterMobile: "/posters/greybox/vibo-mobile.png",
  },
  budget: {
    maxTriangles: 100000,
    maxDrawCalls: 100,
    maxAssetKB: { desktop: 1500, mobile: 600 },
  },
}
