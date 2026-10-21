import { useSyncExternalStore } from "react"

import {
  getGpuStats,
  subscribeGpuStats,
} from "@/experience/gpuStats"
import { useExperienceStore } from "@/experience/hooks"

function readHudVisible(): boolean {
  if (typeof window === "undefined") {
    return import.meta.env.DEV
  }

  const params = new URLSearchParams(window.location.search)
  return params.has("spike") || params.has("debug") || import.meta.env.DEV
}

/**
 * HUD del spike: geometrías/texturas/triángulos + heap JS.
 * Visible con `?spike=1` o en dev. Sirve para verificar que tras 5 idas y
 * vueltas home↔caso los contadores no crecen sin techo.
 */
export function MemoryHud() {
  const { chapterId, quality } = useExperienceStore()
  const stats = useSyncExternalStore(
    subscribeGpuStats,
    getGpuStats,
    getGpuStats
  )
  const visible = readHudVisible()

  if (!visible) return null

  return (
    <aside
      className="pointer-events-none fixed right-3 bottom-3 z-50 max-w-xs rounded-md border border-white/15 bg-black/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/90 backdrop-blur-sm"
      aria-label="Métricas del spike de runtime"
      data-spike-hud
    >
      <p className="mb-1 font-semibold tracking-wide text-white uppercase">
        Spike runtime · GPU
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt>capítulo</dt>
        <dd>{chapterId ?? "—"}</dd>
        <dt>quality</dt>
        <dd>{quality}</dd>
        <dt>geometries</dt>
        <dd>{stats.geometries}</dd>
        <dt>textures</dt>
        <dd>{stats.textures}</dd>
        <dt>programs</dt>
        <dd>{stats.programs}</dd>
        <dt>draw calls</dt>
        <dd>{stats.calls}</dd>
        <dt>triangles</dt>
        <dd>{stats.triangles}</dd>
        <dt>js heap</dt>
        <dd>{stats.jsHeapMB !== null ? `${stats.jsHeapMB} MB` : "n/d"}</dd>
      </dl>
      <p className="mt-2 text-[10px] text-white/55">
        Verificación G0: navegar home↔caso 5 veces; geometries/textures no deben
        subir en cada viaje.
      </p>
    </aside>
  )
}
