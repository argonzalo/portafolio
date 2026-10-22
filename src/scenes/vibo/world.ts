/**
 * Geometría compartida de la escena Vibo (sin dependencias de three):
 * la usan `definition.ts` (hilo) y `Scene.tsx` (mundo, pelota y cámara).
 * Unidades en metros; la red está en z = 0 y el jugador A en la mitad z > 0.
 */
import { HERO_PATH } from "./data"

export type Vec3 = [number, number, number]

export const COURT = {
  width: 10,
  length: 20,
  serviceLine: 6.95,
  netHeight: 0.88,
  wallHeight: 3,
  /** Profundidad desde el fondo cubierta por cristal en las paredes laterales. */
  sideGlass: 4,
} as const

/** Metros del pipeline (origen en el fondo rival) → mundo. */
export function courtToWorld(x: number, y: number, height = 0): Vec3 {
  return [x - COURT.width / 2, height, y - COURT.length / 2]
}

/** Reflectores: postes fuera de las paredes laterales, apuntando al centro. */
export const FLOODLIGHTS: readonly Vec3[] = [
  [-6.6, 6.4, 5.2],
  [6.6, 6.4, 5.2],
  [-6.6, 6.4, -5.2],
  [6.6, 6.4, -5.2],
]

/** Valores del mundo escritos por la escena en cada frame (sin re-render). */
export type CourtState = {
  lines: number
  lights: [number, number, number, number]
  heat: number
  /** Atenuación general del mundo hacia el handoff. */
  dim: number
}

export function createCourtState(): CourtState {
  return { lines: 0, lights: [0, 0, 0, 0], heat: 0, dim: 1 }
}

export const HERO_POSITION: Vec3 = [-2.4, 0, 5.2]
/** El modelo mira a +Z; se gira para mirar hacia la red. */
export const HERO_YAW = Math.PI

/** Ventanas de progreso del capítulo. */
export const TIMELINE = {
  lines: [0.015, 0.15] as const,
  floodlights: [0.07, 0.19] as const,
  playerIn: [0.1, 0.2] as const,
  swing: [0.25, 0.5] as const,
  hud: [0.21, 0.25, 0.55, 0.59] as const,
  graph: [0.24, 0.28, 0.55, 0.6] as const,
  panel: [0.21, 0.24, 0.56, 0.6] as const,
  heat: [0.59, 0.67, 0.8, 0.86] as const,
  card: [0.77, 0.82, 0.92, 0.97] as const,
} as const

/**
 * Golpe: el clip `Volea_prueba_2.5s` va de la preparación (0 s) al impacto
 * (~1,2 s) y la terminación (1,75 s); después vuelve a la pose inicial.
 */
export const SWING = {
  clipStart: 0.04,
  clipEnd: 1.75,
  /** Instante del impacto en el rango 0..1 del golpe. */
  contact: 0.66,
  /** La pelota entra en cuadro desde este instante del golpe. */
  ballIn: 0.3,
} as const

/** Punto de impacto (cabeza de la paleta en `SWING.contact`). */
export const CONTACT: Vec3 = [-2.08, 1.66, 4.78]

function bezier(a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3 {
  const u = 1 - t
  const w0 = u * u * u
  const w1 = 3 * u * u * t
  const w2 = 3 * u * t * t
  const w3 = t * t * t
  return [
    a[0] * w0 + b[0] * w1 + c[0] * w2 + d[0] * w3,
    a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3,
    a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3,
  ]
}

const OUT_BOUNCE: [Vec3, Vec3, Vec3, Vec3] = [
  [1.5, 0.04, -6.6],
  [1.8, 0.9, -7.8],
  [2.1, 1.3, -8.9],
  [2.35, 1.05, -9.85],
]

/**
 * Trayectoria diseñada (ADR-011): no reconstruye el tracking real.
 * `contact` permite anclarla a la cabeza de la paleta medida en runtime.
 */
export function ballIncoming(t: number, contact: Vec3 = CONTACT): Vec3 {
  const [cx, cy, cz] = contact
  return bezier(
    [2.4, 2.2, -7.5],
    [2.2, 3.3, -2.2],
    [cx + 2.1, cy + 0.7, cz - 2.2],
    contact,
    Math.min(1, Math.max(0, t))
  )
}

export function ballOutgoing(t: number, contact: Vec3 = CONTACT): Vec3 {
  const [cx, cy, cz] = contact
  const u = Math.min(1, Math.max(0, t))
  return u < 0.72
    ? bezier(contact, [cx + 1.1, cy + 0.7, cz - 3], [1, 1.2, -3.8], OUT_BOUNCE[0], u / 0.72)
    : bezier(...OUT_BOUNCE, (u - 0.72) / 0.28)
}

/** Posición de la pelota para un instante del golpe (null = fuera de cuadro). */
export function ballAt(swing: number, contact: Vec3 = CONTACT): Vec3 | null {
  if (swing < SWING.ballIn) return null
  if (swing <= SWING.contact)
    return ballIncoming((swing - SWING.ballIn) / (SWING.contact - SWING.ballIn), contact)
  return ballOutgoing((swing - SWING.contact) / (1 - SWING.contact), contact)
}

export function samplePath(
  fn: (t: number) => Vec3,
  count: number,
  from = 0,
  to = 1
): Vec3[] {
  return Array.from({ length: count }, (_, i) =>
    fn(from + ((to - from) * i) / (count - 1))
  )
}

/** Contorno de la cancha recorrido por el hilo en el beat "mundo". */
export function courtOutline(count: number, height = 0.03): Vec3[] {
  const hw = COURT.width / 2
  const hl = COURT.length / 2
  const corners: Vec3[] = [
    [-hw, height, hl],
    [-hw, height, -hl],
    [hw, height, -hl],
    [hw, height, hl],
    [-hw, height, hl],
  ]
  const perimeter = 2 * (COURT.width + COURT.length)
  const lengths = [COURT.length, COURT.width, COURT.length, COURT.width]
  return Array.from({ length: count }, (_, i) => {
    let d = (i / (count - 1)) * perimeter
    let edge = 0
    while (edge < 3 && d > lengths[edge]) {
      d -= lengths[edge]
      edge++
    }
    const t = Math.min(1, d / lengths[edge])
    const a = corners[edge]
    const b = corners[edge + 1]
    return [a[0] + (b[0] - a[0]) * t, height, a[2] + (b[2] - a[2]) * t]
  })
}

/** Arco abierto a ras del piso que encierra al jugador durante la detección. */
export function heroHalo(count: number, radius = 1.15, height = 0.035): Vec3[] {
  const start = Math.PI * 0.62
  const sweep = Math.PI * 1.82
  return Array.from({ length: count }, (_, i) => {
    const a = start + (sweep * i) / (count - 1)
    return [
      HERO_POSITION[0] + Math.cos(a) * radius,
      height,
      HERO_POSITION[2] + Math.sin(a) * radius,
    ]
  })
}

/** Recorrido real del jugador A (homografía del pipeline) a ras del piso. */
export const HERO_TRAIL: Vec3[] = HERO_PATH.map(([x, y]) =>
  courtToWorld(x, y, 0.05)
)

export type CameraKey = {
  at: number
  desktop: Vec3
  mobile: Vec3
  target: Vec3
  mobileTarget?: Vec3
  sway?: number
}

/** Encuadres por beat: plano general → réplica orbital → cenital → tarjeta. */
export const CAMERA_KEYS: readonly CameraKey[] = [
  {
    at: 0,
    desktop: [0.6, 10.5, 23],
    mobile: [0.4, 19, 33],
    target: [0, 0, 0.5],
    mobileTarget: [0, 0, 1],
    sway: 0.04,
  },
  {
    at: 0.14,
    desktop: [-6.5, 4.6, 15.5],
    mobile: [-3.5, 6.5, 19],
    target: [-1.8, 0.9, 3.6],
    mobileTarget: [-2.1, 0.9, 4.2],
    sway: 0.03,
  },
  {
    at: 0.24,
    desktop: [0.4, 1.75, 1.15],
    mobile: [-3.4, 1.95, -1.9],
    target: [-2.25, 1.12, 5.05],
    mobileTarget: [-2.4, 0.62, 5.2],
    sway: 0.012,
  },
  {
    at: 0.42,
    desktop: [-4.25, 1.55, 2.35],
    mobile: [-4.55, 1.9, -0.8],
    target: [-2.15, 1.2, 4.95],
    mobileTarget: [-2.35, 0.62, 5.1],
    sway: 0.01,
  },
  {
    at: 0.56,
    desktop: [-4.3, 2.9, 0.9],
    mobile: [-4.55, 3.0, -1.4],
    target: [-1.6, 1.05, 3.6],
    mobileTarget: [-2.1, 2.0, 4.6],
    sway: 0.015,
  },
  {
    at: 0.68,
    desktop: [-10.5, 23, 0.4],
    mobile: [0.02, 30, 2.2],
    target: [0, 0, 0.4],
    mobileTarget: [0, 0, 0.6],
    sway: 0.02,
  },
  {
    at: 0.74,
    desktop: [-10, 22.4, 1.2],
    mobile: [0.02, 29.4, 2.6],
    target: [0, 0, 0.6],
    mobileTarget: [0, 0, 0.8],
    sway: 0.02,
  },
  {
    at: 0.8,
    desktop: [-0.2, 1.75, 1.3],
    mobile: [0, 2.3, -1.6],
    target: [-3.15, 1.15, 4.65],
    mobileTarget: [-2.4, 0.95, 5.1],
    sway: 0.025,
  },
  {
    at: 0.92,
    desktop: [0.15, 1.85, 1.75],
    mobile: [0.2, 2.35, -1.3],
    target: [-3.1, 1.15, 4.7],
    mobileTarget: [-2.4, 1.0, 5.1],
    sway: 0.02,
  },
  {
    at: 1,
    desktop: [1.8, 3.6, -2.6],
    mobile: [0.6, 4.2, -3.6],
    target: [-2.2, 0.9, 4.2],
    mobileTarget: [-2.2, 0.9, 4.4],
    sway: 0.02,
  },
]
