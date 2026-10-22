import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Color, MathUtils, PerspectiveCamera, Vector3 } from "three"
import { experienceStore } from "@/experience/store"
import type { SceneProps } from "@/experience/types"

export type Vec3Tuple = [number, number, number]

export type BeatCameraFrame = {
  /** Posición en progreso del capítulo (0..1). */
  at: number
  /** Posición de cámara en desktop (landscape). */
  desktop: Vec3Tuple
  /** Posición de cámara en mobile (portrait). */
  mobile: Vec3Tuple
  /** Punto al que mira la cámara en desktop. */
  target: Vec3Tuple
  /** Punto al que mira la cámara en mobile (opcional; si se omite usa `target`). */
  mobileTarget?: Vec3Tuple
  /** Campo visual vertical en desktop (opcional; default 45). */
  fov?: number
  /** Campo visual vertical en mobile (opcional; default `fov` o 50). */
  mobileFov?: number
  /** Amplitud de micro-deriva respiratoria (0 para encuadre fijo). */
  sway?: number
}

export type InterpolatedCameraState = {
  position: Vec3Tuple
  target: Vec3Tuple
  fov: number
  sway: number
  segmentIndex: number
  segmentProgress: number
}

export const KIT_LINE_SAMPLES = 32

/** Smoothstep clásico C1 en el rango [start, end]. */
export function phase(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0
  const t = MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Quintic smoothstep C2: derivada primera y segunda nulas en los bordes del beat. */
export function smootherPhase(
  progress: number,
  start: number,
  end: number
): number {
  if (end <= start) return progress >= end ? 1 : 0
  const t = MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Envolvente suave 0 → 1 → 0 para aparición y salida de elementos dentro de un beat.
 */
export function beatEnvelope(
  progress: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number
): number {
  const enter = phase(progress, enterStart, enterEnd)
  const exit = 1 - phase(progress, exitStart, exitEnd)
  return MathUtils.clamp(enter * exit, 0, 1)
}

/**
 * Re-muestrea una polilínea o curva Catmull-Rom de control a 32 puntos uniformes.
 */
export function resampleCurvePoints(
  controlPoints: readonly Vec3Tuple[],
  output: Vector3[],
  smooth = true
): void {
  const n = controlPoints.length
  if (n === 0) return

  if (n === 1) {
    const [x, y, z] = controlPoints[0]
    for (let i = 0; i < output.length; i += 1) {
      output[i].set(x, y, z)
    }
    return
  }

  for (let i = 0; i < output.length; i += 1) {
    const u = i / (output.length - 1)
    const scaled = u * (n - 1)
    const idx = Math.min(Math.floor(scaled), n - 2)
    const t = scaled - idx

    if (!smooth || n === 2) {
      const a = controlPoints[idx]
      const b = controlPoints[idx + 1]
      output[i].set(
        MathUtils.lerp(a[0], b[0], t),
        MathUtils.lerp(a[1], b[1], t),
        MathUtils.lerp(a[2], b[2], t)
      )
      continue
    }

    const p0 = controlPoints[Math.max(0, idx - 1)]
    const p1 = controlPoints[idx]
    const p2 = controlPoints[idx + 1]
    const p3 = controlPoints[Math.min(n - 1, idx + 2)]

    const t2 = t * t
    const t3 = t2 * t
    const sampleChannel = (c: 0 | 1 | 2) => {
      const m1 = (p2[c] - p0[c]) * 0.45
      const m2 = (p3[c] - p1[c]) * 0.45
      const a = 2 * p1[c] - 2 * p2[c] + m1 + m2
      const b = -3 * p1[c] + 3 * p2[c] - 2 * m1 - m2
      return a * t3 + b * t2 + m1 * t + p1[c]
    }

    output[i].set(sampleChannel(0), sampleChannel(1), sampleChannel(2))
  }
}

export function formatKitNumber(
  value: number,
  decimals = 0,
  prefix = "",
  suffix = ""
): string {
  const factor = 10 ** decimals
  const rounded = Math.round(value * factor) / factor
  const formatted = rounded.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${prefix}${formatted}${suffix}`
}

export function buildTrendSvgGeometry(
  samples: readonly number[],
  width = 320,
  height = 92,
  padX = 10,
  padY = 14
): {
  linePath: string
  areaPath: string
  coords: { x: number; y: number }[]
} {
  if (samples.length === 0) {
    return { linePath: "", areaPath: "", coords: [] }
  }

  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const coords = samples.map((v, i) => {
    const u = samples.length === 1 ? 0.5 : i / (samples.length - 1)
    const clamped = MathUtils.clamp(v, 0, 1)
    return {
      x: padX + u * innerW,
      y: padY + (1 - clamped) * innerH,
    }
  })

  if (coords.length === 1) {
    const p = coords[0]
    const linePath = `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    return { linePath, areaPath: linePath, coords }
  }

  let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }

  const baselineY = (height - 6).toFixed(1)
  const firstX = coords[0].x.toFixed(1)
  const lastX = coords[coords.length - 1].x.toFixed(1)
  const areaPath = `${d} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`

  return { linePath: d, areaPath, coords }
}

function catmullRomChannel(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
  tension = 0.35
): number {
  const t2 = t * t
  const t3 = t2 * t
  const m1 = (p2 - p0) * tension
  const m2 = (p3 - p1) * tension
  const a = 2 * p1 - 2 * p2 + m1 + m2
  const b = -3 * p1 + 3 * p2 - 2 * m1 - m2
  return a * t3 + b * t2 + m1 * t + p1
}

function sampleSplineTuple(
  p0: Vec3Tuple,
  p1: Vec3Tuple,
  p2: Vec3Tuple,
  p3: Vec3Tuple,
  t: number,
  tension = 0.32
): Vec3Tuple {
  return [
    catmullRomChannel(p0[0], p1[0], p2[0], p3[0], t, tension),
    catmullRomChannel(p0[1], p1[1], p2[1], p3[1], t, tension),
    catmullRomChannel(p0[2], p1[2], p2[2], p3[2], t, tension),
  ]
}

/**
 * Interpola de forma pura y determinista el estado de cámara para un progreso 0..1.
 * Usa splines Catmull-Rom con tensión controlada para que el paso entre beats
 * no tenga quiebres bruscos de dirección.
 */
export function interpolateCameraState(
  frames: readonly BeatCameraFrame[],
  progress: number,
  isMobile: boolean,
  reducedMotion = false
): InterpolatedCameraState {
  if (frames.length === 0) {
    return {
      position: [0, 0, 5],
      target: [0, 0, 0],
      fov: 45,
      sway: 0,
      segmentIndex: 0,
      segmentProgress: 0,
    }
  }

  const p = MathUtils.clamp(progress, 0, 1)

  if (frames.length === 1) {
    const only = frames[0]
    return {
      position: isMobile ? [...only.mobile] : [...only.desktop],
      target: isMobile
        ? [...(only.mobileTarget ?? only.target)]
        : [...only.target],
      fov: isMobile ? (only.mobileFov ?? only.fov ?? 50) : (only.fov ?? 45),
      sway: reducedMotion ? 0 : (only.sway ?? 0.04),
      segmentIndex: 0,
      segmentProgress: 0,
    }
  }

  let index = 0
  while (index < frames.length - 2 && p > frames[index + 1].at) {
    index += 1
  }

  const f0 = frames[Math.max(0, index - 1)]
  const f1 = frames[index]
  const f2 = frames[Math.min(frames.length - 1, index + 1)]
  const f3 = frames[Math.min(frames.length - 1, index + 2)]

  const rawT =
    f2.at <= f1.at ? 0 : MathUtils.clamp((p - f1.at) / (f2.at - f1.at), 0, 1)
  const t = reducedMotion
    ? phase(p, f1.at, f2.at)
    : smootherPhase(p, f1.at, f2.at)

  const pos0 = isMobile ? f0.mobile : f0.desktop
  const pos1 = isMobile ? f1.mobile : f1.desktop
  const pos2 = isMobile ? f2.mobile : f2.desktop
  const pos3 = isMobile ? f3.mobile : f3.desktop

  const tgt0 = isMobile ? (f0.mobileTarget ?? f0.target) : f0.target
  const tgt1 = isMobile ? (f1.mobileTarget ?? f1.target) : f1.target
  const tgt2 = isMobile ? (f2.mobileTarget ?? f2.target) : f2.target
  const tgt3 = isMobile ? (f3.mobileTarget ?? f3.target) : f3.target

  const tension = reducedMotion ? 0 : 0.28
  const position = sampleSplineTuple(pos0, pos1, pos2, pos3, t, tension)
  const target = sampleSplineTuple(tgt0, tgt1, tgt2, tgt3, t, tension)

  const fov1 = isMobile ? (f1.mobileFov ?? f1.fov ?? 50) : (f1.fov ?? 45)
  const fov2 = isMobile ? (f2.mobileFov ?? f2.fov ?? 50) : (f2.fov ?? 45)
  const fov = MathUtils.lerp(fov1, fov2, t)

  const sway1 = f1.sway ?? 0.035
  const sway2 = f2.sway ?? 0.035
  const sway = reducedMotion ? 0 : MathUtils.lerp(sway1, sway2, t)

  return {
    position,
    target,
    fov,
    sway,
    segmentIndex: index,
    segmentProgress: rawT,
  }
}

export type BeatCameraRigOptions = {
  frames: readonly BeatCameraFrame[]
  background?: string
  /** Factor de amortiguación exponencial por segundo. */
  damping?: number
}

function isRigOptionsObject(
  input: BeatCameraRigOptions | readonly BeatCameraFrame[]
): input is BeatCameraRigOptions {
  return !Array.isArray(input) && "frames" in input
}

/**
 * Rig de cámara por beats para escenas del portafolio (T-A18).
 * Lee `props.progress.current` dentro de `useFrame` sin provocar renders de React.
 */
export function useBeatCameraRig(
  props: SceneProps,
  options: BeatCameraRigOptions | readonly BeatCameraFrame[],
  legacyBackground?: string
): void {
  const resolved = isRigOptionsObject(options)
    ? {
        frames: options.frames,
        background: options.background,
        damping: options.damping ?? 14,
      }
    : {
        frames: options,
        background: legacyBackground,
        damping: 14,
      }

  const bgColor = useMemo(
    () => (resolved.background ? new Color(resolved.background) : null),
    [resolved.background]
  )
  const targetVec = useRef(new Vector3())
  const desiredPos = useRef(new Vector3())
  const desiredTarget = useRef(new Vector3())
  const initialized = useRef(false)
  const elapsedRef = useRef(0)

  useFrame(({ camera, scene }, delta) => {
    if (!props.active) return

    const reducedMotion = experienceStore.getSnapshot().reducedMotion
    const state = interpolateCameraState(
      resolved.frames,
      props.progress.current,
      props.isMobile,
      reducedMotion
    )

    elapsedRef.current += Math.min(delta, 0.05)
    const breatheX =
      state.sway > 0 ? Math.sin(elapsedRef.current * 0.9) * state.sway : 0
    const breatheY =
      state.sway > 0
        ? Math.cos(elapsedRef.current * 0.65) * state.sway * 0.65
        : 0

    desiredPos.current.set(
      state.position[0] + breatheX,
      state.position[1] + breatheY,
      state.position[2]
    )
    desiredTarget.current.set(state.target[0], state.target[1], state.target[2])

    // En saltos de deep link o primer frame aplicamos posición directa para capturas deterministas.
    const jumpDistance = camera.position.distanceToSquared(desiredPos.current)
    if (!initialized.current || reducedMotion || jumpDistance > 9) {
      camera.position.copy(desiredPos.current)
      targetVec.current.copy(desiredTarget.current)
      initialized.current = true
    } else {
      const alpha = 1 - Math.exp(-resolved.damping * Math.min(delta, 0.05))
      camera.position.lerp(desiredPos.current, alpha)
      targetVec.current.lerp(desiredTarget.current, alpha)
    }

    if ("isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
      const persp = camera as PerspectiveCamera
      if (Math.abs(persp.fov - state.fov) > 0.05) {
        persp.fov = state.fov
        persp.updateProjectionMatrix()
      }
    }

    camera.lookAt(targetVec.current)

    if (bgColor) {
      scene.background = bgColor
    }
  })
}
