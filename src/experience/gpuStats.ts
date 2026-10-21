/**
 * Snapshot liviano que escribe el Canvas (R3F) y lee el HUD DOM del spike.
 * Evita setState por frame: el HUD hace polling a 2 Hz.
 */
export type GpuStatsSnapshot = {
  geometries: number
  textures: number
  programs: number
  calls: number
  triangles: number
  /** Heap JS en MB si el browser lo expone (Chrome). */
  jsHeapMB: number | null
  /** Marca de tiempo de la última muestra. */
  at: number
}

let latest: GpuStatsSnapshot = {
  geometries: 0,
  textures: 0,
  programs: 0,
  calls: 0,
  triangles: 0,
  jsHeapMB: null,
  at: 0,
}

const listeners = new Set<() => void>()

export function getGpuStats(): GpuStatsSnapshot {
  return latest
}

export function setGpuStats(patch: Partial<GpuStatsSnapshot>): void {
  latest = {
    ...latest,
    ...patch,
    at: typeof performance === "undefined" ? Date.now() : performance.now(),
  }

  for (const listener of [...listeners]) {
    listener()
  }
}

export function subscribeGpuStats(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function readJsHeapMB(): number | null {
  const memory = (
    performance as Performance & {
      memory?: { usedJSHeapSize: number }
    }
  ).memory

  if (!memory) return null
  return Math.round((memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10
}
