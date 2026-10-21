import { experienceStore } from "@/experience/store"
import type { QualityTier } from "@/experience/types"

/**
 * Detección y adaptación del nivel de calidad (`01-arquitectura.md` §6).
 *
 * - Detección inicial: WebGL2, GPU (`WEBGL_debug_renderer_info`), núcleos,
 *   memoria, ancho de pantalla, puntero, `Save-Data` y `prefers-reduced-motion`.
 * - Adaptación en vivo: ventanas de ~1,5 s con histéresis. Bajar es rápido
 *   (2–3 ventanas), subir es lento (5 ventanas, enfriamiento de 20 s y como
 *   máximo dos subidas por sesión) para que el nivel no oscile.
 * - El nivel se guarda en `sessionStorage` y se puede forzar con `?quality=`.
 * - Sin dependencias de React: el sampler vive en `debug.tsx` y el panel en el
 *   overlay/lab. Todo lo de acá se puede llamar desde un test o un script.
 */

export const QUALITY_TIERS: readonly QualityTier[] = [
  "high",
  "medium",
  "low",
  "static",
]

/** Rango de DPR por nivel (`02-rendimiento-y-mobile.md` §3). */
export const QUALITY_DPR: Record<QualityTier, [number, number]> = {
  high: [1, 2],
  medium: [1, 1.5],
  low: [1, 1],
  static: [1, 1],
}

export type QualityReason =
  | "forced"
  | "stored"
  | "reduced-motion"
  | "save-data"
  | "slow-network"
  | "no-webgl"
  | "software-gpu"
  | "low-end"
  | "mobile"
  | "desktop"
  | "fallback"
  | "adaptive"

export type QualityLock = "forced" | "environment" | null

export type QualityState = {
  tier: QualityTier
  reason: QualityReason
  /** `forced`: `?quality=` o el panel; `environment`: el dispositivo no puede más. */
  lock: QualityLock
  /** `false` cuando no se debe adaptar (forzado o limitado por el entorno). */
  adaptive: boolean
}

export type DeviceSignals = {
  webgl2: boolean
  gpu: string | null
  cores: number
  memoryGB: number | null
  width: number
  dpr: number
  coarsePointer: boolean
  saveData: boolean
  reducedMotion: boolean
  effectiveType: string | null
}

export type QualityStats = QualityState & {
  /** FPS de la última ventana completa (0 hasta la primera medición). */
  fps: number
  /** Frame time promedio de los últimos frames, en ms. */
  frameMs: number
  /** Percentil 95 del frame time reciente, en ms. */
  p95FrameMs: number
  downgrades: number
  upgrades: number
  signals: DeviceSignals | null
}

const STORAGE_KEY = "experience:quality"

const SLOW_NETWORKS = new Set(["slow-2g", "2g", "3g"])

const SOFTWARE_GPU =
  /swiftshader|llvmpipe|softpipe|software rasterizer|basic render|microsoft basic|mesa offscreen/i

const LOW_END_MOBILE_GPU =
  /mali-[gt]?[3-5]|adreno.*\b[2-5]\d\d\b|powervr|videocore/i

const STRONG_GPU = /nvidia|geforce|rtx|gtx|radeon|apple m\d|apple gpu/i

type NetworkInformationLike = {
  saveData?: boolean
  effectiveType?: string
  addEventListener?: (type: "change", listener: () => void) => void
  removeEventListener?: (type: "change", listener: () => void) => void
}

type NavigatorWithHints = Navigator & {
  deviceMemory?: number
  connection?: NetworkInformationLike
}

export function isQualityTier(
  value: string | null | undefined
): value is QualityTier {
  return (
    typeof value === "string" &&
    (QUALITY_TIERS as readonly string[]).includes(value)
  )
}

/** `true` si el dispositivo no puede rendir 3D con garantías. */
export function isStaticReason(reason: QualityReason): boolean {
  return (
    reason === "reduced-motion" ||
    reason === "save-data" ||
    reason === "slow-network" ||
    reason === "no-webgl" ||
    reason === "software-gpu"
  )
}

function readConnection(): NetworkInformationLike | undefined {
  return (navigator as NavigatorWithHints).connection
}

function detectWebgl(): { supported: boolean; renderer: string | null } {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2")

    if (!gl) {
      return { supported: false, renderer: null }
    }

    const info = gl.getExtension("WEBGL_debug_renderer_info")
    const renderer = info
      ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER) ?? "")

    // El presupuesto es un solo contexto WebGL en todo el sitio
    // (`02-rendimiento-y-mobile.md` §1): liberar el de sondeo.
    gl.getExtension("WEBGL_lose_context")?.loseContext()

    return { supported: true, renderer: renderer || null }
  } catch {
    return { supported: false, renderer: null }
  }
}

export function readDeviceSignals(): DeviceSignals {
  if (typeof window === "undefined") {
    return {
      webgl2: false,
      gpu: null,
      cores: 0,
      memoryGB: null,
      width: 0,
      dpr: 1,
      coarsePointer: false,
      saveData: false,
      reducedMotion: false,
      effectiveType: null,
    }
  }

  const gl = detectWebgl()
  const nav = navigator as NavigatorWithHints
  const connection = readConnection()

  return {
    webgl2: gl.supported,
    gpu: gl.renderer,
    cores: nav.hardwareConcurrency || 0,
    memoryGB: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    width: window.innerWidth,
    dpr: window.devicePixelRatio || 1,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    saveData: Boolean(connection?.saveData),
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    effectiveType: connection?.effectiveType ?? null,
  }
}

/**
 * Clasificación pura: no toca el DOM, así se puede probar con señales
 * inventadas (por ejemplo una GPU SwiftShader o un móvil de 2 GB).
 */
export function classifyQuality(signals: DeviceSignals): {
  tier: QualityTier
  reason: QualityReason
} {
  if (!signals.webgl2) {
    return { tier: "static", reason: "no-webgl" }
  }

  if (signals.reducedMotion) {
    return { tier: "static", reason: "reduced-motion" }
  }

  if (signals.saveData) {
    return { tier: "static", reason: "save-data" }
  }

  if (signals.effectiveType && SLOW_NETWORKS.has(signals.effectiveType)) {
    return { tier: "static", reason: "slow-network" }
  }

  const gpu = (signals.gpu ?? "").toLowerCase()

  // Render por software: no hay GPU real, el 3D no es defendible.
  if (SOFTWARE_GPU.test(gpu)) {
    return { tier: "static", reason: "software-gpu" }
  }

  const mobile = signals.coarsePointer || signals.width <= 768
  const lowCores = signals.cores > 0 && signals.cores <= 4
  const lowMemory = signals.memoryGB !== null && signals.memoryGB <= 4

  if (mobile) {
    if (lowCores || lowMemory || LOW_END_MOBILE_GPU.test(gpu)) {
      return { tier: "low", reason: "low-end" }
    }

    return { tier: "medium", reason: "mobile" }
  }

  if (lowCores && lowMemory) {
    return { tier: "low", reason: "low-end" }
  }

  // GPU dedicada (o Apple Silicon) con suficientes núcleos; el resto de
  // escritorio se queda en `medium`. Sin info de GPU no se arriesga `high`.
  if (STRONG_GPU.test(gpu) && signals.cores >= 8) {
    return { tier: "high", reason: "desktop" }
  }

  return { tier: "medium", reason: "desktop" }
}

function readStoredQuality(): QualityTier | null {
  if (typeof window === "undefined") return null

  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY)
    return isQualityTier(value) ? value : null
  } catch {
    return null
  }
}

function writeStoredQuality(tier: QualityTier): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, tier)
  } catch {
    // Safari privado o storage deshabilitado: seguir sin persistir.
  }
}

export function readForcedQuality(search: string): QualityTier | null {
  const value = new URLSearchParams(search).get("quality")
  return isQualityTier(value) ? value : null
}

/**
 * Resuelve el nivel inicial. Orden:
 * 1. El entorno manda (`static` sin WebGL, movimiento reducido, Save-Data…).
 * 2. `?quality=` fuerza un nivel reproducible para capturas y QA.
 * 3. Nivel guardado en la sesión.
 * 4. Clasificación del dispositivo.
 */
export function detectQuality(
  search: string,
  signals: DeviceSignals = readDeviceSignals()
): QualityState {
  const detected = classifyQuality(signals)

  if (detected.tier === "static") {
    return { ...detected, lock: "environment", adaptive: false }
  }

  const forced = readForcedQuality(search)
  if (forced) {
    return { tier: forced, reason: "forced", lock: "forced", adaptive: false }
  }

  const stored = readStoredQuality()
  if (stored) {
    return {
      tier: clampToCeiling(stored, tierCeiling(signals)),
      reason: "stored",
      lock: null,
      adaptive: true,
    }
  }

  return { ...detected, lock: null, adaptive: true }
}

const FALLBACK_STATE: QualityState = {
  tier: "medium",
  reason: "fallback",
  lock: null,
  adaptive: true,
}

let state: QualityState | null = null
let signals: DeviceSignals | null = null

// Medición en vivo (ventanas con histéresis).
const WINDOW_SECONDS = 1.5
const WARMUP_SECONDS = 2
const UPGRADE_COOLDOWN_MS = 20_000
const MAX_UPGRADES = 2
const RECENT_DELTAS = 120

const DOWNGRADE_FPS: Partial<Record<QualityTier, number>> = {
  high: 45,
  medium: 40,
  low: 28,
}

const DOWNGRADE_WINDOWS: Partial<Record<QualityTier, number>> = {
  high: 2,
  medium: 2,
  low: 3,
}

const UPGRADE_FPS: Partial<Record<QualityTier, number>> = {
  low: 55,
  medium: 57,
}

const UPGRADE_WINDOWS = 5

const ORDER: readonly QualityTier[] = ["low", "medium", "high"]

let windowElapsed = 0
let windowFrames = 0
let warmupElapsed = 0
let slowWindows = 0
let fastWindows = 0
let fps = 0
let downgrades = 0
let upgrades = 0
let lastChangeAt = 0
let recentDeltas: number[] = []

function resetMeasurements(): void {
  windowElapsed = 0
  windowFrames = 0
  warmupElapsed = 0
  slowWindows = 0
  fastWindows = 0
  fps = 0
  downgrades = 0
  upgrades = 0
  recentDeltas = []
  lastChangeAt =
    typeof performance === "undefined" ? Date.now() : performance.now()
}

function commit(next: QualityState): void {
  state = next
  experienceStore.setQuality(next.tier)

  // Solo se recuerda lo detectado/adaptado; un forzado dura la sesión de la
  // pestaña y no debe condicionar la siguiente.
  if (next.lock === null) {
    writeStoredQuality(next.tier)
  }
}

/** Detecta el nivel inicial y lo publica en el store. Idempotente. */
export function initQuality(): QualityStats {
  if (typeof window === "undefined") {
    return getQualityStats()
  }

  signals = readDeviceSignals()
  resetMeasurements()
  commit(detectQuality(window.location.search, signals))

  return getQualityStats()
}

function writeSearch(url: URL): void {
  // `?debug=` → `?debug`: los flags se leen por presencia y así el deep link
  // queda igual al documentado.
  const search = url.searchParams.toString().replace(/=(?=&|$)/g, "")
  url.search = search ? `?${search}` : ""
}

/**
 * Fuerza un nivel desde el panel de debug o el laboratorio. `null` vuelve a
 * detección automática (y quita `?quality=` de la URL).
 */
export function forceQuality(tier: QualityTier | null): void {
  if (typeof window === "undefined") {
    return
  }

  const url = new URL(window.location.href)

  if (tier) {
    url.searchParams.set("quality", tier)
    writeSearch(url)
    window.history.replaceState(window.history.state, "", url)
    commit({ tier, reason: "forced", lock: "forced", adaptive: false })
    return
  }

  url.searchParams.delete("quality")
  writeSearch(url)
  window.history.replaceState(window.history.state, "", url)
  commit(detectQuality(url.search, signals ?? readDeviceSignals()))
  resetMeasurements()
}

/**
 * Reacciona a cambios de preferencias (movimiento reducido, Save-Data,
 * conexión). Un forzado explícito se respeta, salvo que el entorno pase a
 * exigir `static`.
 */
export function syncQualityWithPreferences(): void {
  if (typeof window === "undefined" || !state) {
    return
  }

  signals = readDeviceSignals()
  const detected = classifyQuality(signals)

  if (detected.tier === "static") {
    commit({ ...detected, lock: "environment", adaptive: false })
    return
  }

  if (state.lock === "forced" || state.lock === null) {
    return
  }

  // Se liberó la restricción del entorno: volver a detectar.
  commit(detectQuality(window.location.search, signals))
  resetMeasurements()
}

export function getQualityState(): QualityState {
  return state ?? FALLBACK_STATE
}

export function getQualityStats(): QualityStats {
  const current = getQualityState()
  const average =
    recentDeltas.length > 0
      ? recentDeltas.reduce((sum, delta) => sum + delta, 0) /
        recentDeltas.length
      : 0

  return {
    ...current,
    fps: Math.round(fps * 10) / 10,
    frameMs: Math.round(average * 1000 * 10) / 10,
    p95FrameMs: Math.round(percentile(recentDeltas, 95) * 1000 * 10) / 10,
    downgrades,
    upgrades,
    signals,
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  )

  return sorted[index]
}

function stepTier(tier: QualityTier, direction: 1 | -1): QualityTier | null {
  const index = ORDER.indexOf(tier)
  if (index === -1) return null

  const next = ORDER[index + direction]
  return next ?? null
}

/**
 * Techo de calidad según el dispositivo: en mobile no se sube de `medium`
 * (`01-arquitectura.md` §6 reserva `high` para escritorio).
 */
function tierCeiling(signals: DeviceSignals | null): QualityTier {
  if (!signals) return "high"
  return signals.coarsePointer || signals.width <= 768 ? "medium" : "high"
}

function clampToCeiling(tier: QualityTier, ceiling: QualityTier): QualityTier {
  const index = ORDER.indexOf(tier)
  const limit = ORDER.indexOf(ceiling)

  if (index === -1 || limit === -1) return tier
  return index > limit ? ceiling : tier
}

/**
 * Alimenta el monitor con el delta de cada frame. Devuelve el nivel nuevo
 * cuando la adaptación cambió algo (útil para tests y para el overlay).
 *
 * No hace nada si el nivel está forzado o limitado por el entorno.
 */
export function observeFrame(
  deltaSeconds: number,
  now: number = typeof performance === "undefined"
    ? Date.now()
    : performance.now()
): QualityTier | null {
  if (!state) {
    return null
  }

  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return null
  }

  // Pestaña en segundo plano, hitch de GC o resize: la ventana no cuenta.
  if (deltaSeconds > 0.5) {
    windowElapsed = 0
    windowFrames = 0
    return null
  }

  recentDeltas.push(deltaSeconds)
  if (recentDeltas.length > RECENT_DELTAS) {
    recentDeltas.shift()
  }

  if (warmupElapsed < WARMUP_SECONDS) {
    warmupElapsed += deltaSeconds
    return null
  }

  windowElapsed += deltaSeconds
  windowFrames += 1

  if (windowElapsed < WINDOW_SECONDS) {
    return null
  }

  fps = windowFrames / windowElapsed
  windowElapsed = 0
  windowFrames = 0

  // Un nivel forzado no se adapta, pero igual necesita FPS y frame time para
  // las capturas y la tabla de métricas.
  if (!state.adaptive) {
    return null
  }

  const tier = state.tier
  const downAt = DOWNGRADE_FPS[tier]
  const upAt = UPGRADE_FPS[tier]

  if (downAt !== undefined && fps < downAt) {
    slowWindows += 1
    fastWindows = 0
  } else if (upAt !== undefined && fps >= upAt) {
    fastWindows += 1
    slowWindows = 0
  } else {
    slowWindows = 0
    fastWindows = 0
  }

  if (slowWindows >= (DOWNGRADE_WINDOWS[tier] ?? Infinity)) {
    const next = stepTier(tier, -1)
    slowWindows = 0
    fastWindows = 0
    lastChangeAt = now

    if (next) {
      downgrades += 1
      commit({ tier: next, reason: "adaptive", lock: null, adaptive: true })
      return next
    }
  }

  if (
    fastWindows >= UPGRADE_WINDOWS &&
    upgrades < MAX_UPGRADES &&
    now - lastChangeAt >= UPGRADE_COOLDOWN_MS
  ) {
    const next = stepTier(tier, 1)
    fastWindows = 0
    slowWindows = 0

    if (next && ORDER.indexOf(next) <= ORDER.indexOf(tierCeiling(signals))) {
      lastChangeAt = now
      upgrades += 1
      commit({ tier: next, reason: "adaptive", lock: null, adaptive: true })
      return next
    }
  }

  return null
}
