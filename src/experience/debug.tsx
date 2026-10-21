import { useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"

import { isFlagOn } from "@/experience/deepLink"
import { getGpuStats, type GpuStatsSnapshot } from "@/experience/gpuStats"
import { useExperienceStore } from "@/experience/hooks"
import {
  forceQuality,
  getQualityStats,
  observeFrame,
  QUALITY_TIERS,
  type QualityStats,
} from "@/experience/quality"
import { experienceStore } from "@/experience/store"
import type { QualityTier } from "@/experience/types"

/**
 * Instrumentación del runtime (T-A07):
 *
 * - `QualityMonitor`: sampler de frames dentro del Canvas. Alimenta la
 *   adaptación de `quality.ts` (ventanas con histéresis). No hace setState.
 * - `DebugOverlay`: overlay `?debug` con FPS, frame time, draw calls,
 *   triángulos, texturas, geometrías, nivel y beat; permite forzar un nivel y
 *   copiar el deep link del estado actual.
 *
 * Se usa un monitor propio en lugar del `PerformanceMonitor` de drei porque
 * acá la histéresis es explícita (ventanas, enfriamiento y tope de subidas) y
 * se puede medir desde el overlay y desde el laboratorio.
 */

export function QualityMonitor() {
  useFrame((_, delta) => {
    observeFrame(delta)
  })

  return null
}

function readDebugFlag(): boolean {
  if (typeof window === "undefined") return false

  const params = new URLSearchParams(window.location.search)
  return isFlagOn(params, "debug") || isFlagOn(params, "spike")
}

type DebugSnapshot = {
  quality: QualityStats
  gpu: GpuStatsSnapshot
  progress: number
  /** DPR realmente aplicado al canvas (puede ser menor que el de la pantalla). */
  renderDpr: number | null
  url: string
}

function readCanvasDpr(): number | null {
  if (typeof document === "undefined") return null

  const canvas = document.querySelector<HTMLCanvasElement>(
    "[data-experience-stage] canvas, canvas"
  )

  if (!canvas || !canvas.clientWidth) return null

  return Math.round((canvas.width / canvas.clientWidth) * 100) / 100
}

function readSnapshot(): DebugSnapshot {
  const state = experienceStore.getSnapshot()
  const quality = getQualityStats()
  const progress = state.chapterId
    ? experienceStore.progress(state.chapterId).current
    : 0

  const params = new URLSearchParams()

  const hasSection =
    state.chapterId !== null &&
    typeof document !== "undefined" &&
    Array.from(document.querySelectorAll("[data-chapter]")).some(
      (element) => element.getAttribute("data-chapter") === state.chapterId
    )

  if (state.chapterId && hasSection) {
    params.set("chapter", state.chapterId)
    params.set("progress", progress.toFixed(2))
  }

  if (quality.lock === "forced") {
    params.set("quality", quality.tier)
  }

  params.set("debug", "")

  const query = params.toString().replace(/(^|&)debug=$/, "$1debug")

  return {
    quality,
    gpu: getGpuStats(),
    progress,
    renderDpr: readCanvasDpr(),
    url:
      typeof window === "undefined"
        ? ""
        : `${window.location.pathname}?${query}`,
  }
}

const TONE: Record<QualityTier, string> = {
  high: "text-emerald-300",
  medium: "text-sky-300",
  low: "text-amber-300",
  static: "text-rose-300",
}

export function DebugOverlay({
  alwaysVisible = false,
}: {
  alwaysVisible?: boolean
}) {
  const { chapterId, beat, quality } = useExperienceStore()
  const [open, setOpen] = useState(alwaysVisible)
  const [snapshot, setSnapshot] = useState<DebugSnapshot | null>(null)

  useEffect(() => {
    if (alwaysVisible) {
      return
    }

    const sync = () => {
      setOpen(readDebugFlag())
    }

    sync()
    document.addEventListener("astro:page-load", sync)

    return () => {
      document.removeEventListener("astro:page-load", sync)
    }
  }, [alwaysVisible])

  useEffect(() => {
    if (!open) return

    const refresh = () => setSnapshot(readSnapshot())
    refresh()

    const timer = window.setInterval(refresh, 500)
    return () => window.clearInterval(timer)
  }, [open])

  if (!open) return null

  const q = snapshot?.quality ?? getQualityStats()
  const gpu = snapshot?.gpu ?? getGpuStats()
  const forced = q.lock === "forced"

  return (
    <aside
      data-debug-overlay
      aria-label="Panel de debug del runtime"
      className="fixed right-2 bottom-2 z-[100] max-h-[calc(100svh-1rem)] w-[min(94vw,23rem)] overflow-auto rounded-md border border-white/20 bg-black/85 px-3 py-2 font-mono text-[11px] leading-relaxed text-white/90 shadow-lg backdrop-blur-sm sm:right-3 sm:bottom-3"
    >
      <header className="flex items-center justify-between gap-2">
        <p className="font-semibold tracking-wide text-white uppercase">
          Debug · runtime
        </p>
        {alwaysVisible ? null : (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded px-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar panel de debug"
          >
            ×
          </button>
        )}
      </header>

      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt>nivel</dt>
        <dd className={TONE[quality]}>
          {quality} <span className="text-white/45">({q.reason})</span>
        </dd>
        <dt>modo</dt>
        <dd>
          {forced ? "forzado" : q.adaptive ? "adaptativo" : "entorno"}
          {q.downgrades + q.upgrades > 0
            ? ` · ${q.downgrades}↓ ${q.upgrades}↑`
            : null}
        </dd>
        <dt>fps</dt>
        <dd>
          {q.fps > 0 ? q.fps.toFixed(1) : "midiendo"}
          <span className="text-white/45">
            {" "}
            · {q.frameMs} ms · p95 {q.p95FrameMs} ms
          </span>
        </dd>
        <dt>capítulo</dt>
        <dd>{chapterId ?? "—"}</dd>
        <dt>beat</dt>
        <dd>{beat ? `${beat.sceneId}/${beat.beatId}` : "—"}</dd>
        <dt>progreso</dt>
        <dd>{(snapshot?.progress ?? 0).toFixed(2)}</dd>
        <dt>escenas</dt>
        <dd>{gpu.mountedScenes}</dd>
        <dt>draw calls</dt>
        <dd>{gpu.calls}</dd>
        <dt>triangles</dt>
        <dd>{gpu.triangles.toLocaleString("es-AR")}</dd>
        <dt>textures</dt>
        <dd>{gpu.textures}</dd>
        <dt>geometries</dt>
        <dd>{gpu.geometries}</dd>
        <dt>programs</dt>
        <dd>{gpu.programs}</dd>
        <dt>js heap</dt>
        <dd>{gpu.jsHeapMB !== null ? `${gpu.jsHeapMB} MB` : "n/d"}</dd>
        <dt>dpr</dt>
        <dd>
          {typeof window === "undefined"
            ? "—"
            : `${window.devicePixelRatio.toFixed(2)} · render ${
                snapshot?.renderDpr?.toFixed(2) ?? "—"
              } · ${window.innerWidth}px`}
        </dd>
      </dl>

      <div
        className="mt-2 flex flex-wrap gap-1"
        role="group"
        aria-label="Forzar nivel de calidad"
      >
        {QUALITY_TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => {
              forceQuality(tier)
              setSnapshot(readSnapshot())
            }}
            aria-pressed={quality === tier}
            className={`cursor-pointer rounded border px-1.5 py-0.5 transition-colors ${
              quality === tier
                ? "border-white/60 bg-white/20 text-white"
                : "border-white/15 text-white/70 hover:bg-white/10"
            }`}
          >
            {tier}
          </button>
        ))}
        {forced ? (
          <button
            type="button"
            onClick={() => {
              forceQuality(null)
              setSnapshot(readSnapshot())
            }}
            className="cursor-pointer rounded border border-emerald-300/40 px-1.5 py-0.5 text-emerald-200 hover:bg-emerald-300/10"
          >
            auto
          </button>
        ) : null}
      </div>

      {snapshot?.url ? (
        <p className="mt-2 border-t border-white/10 pt-1.5 text-[10px] break-all text-white/50 select-all">
          {snapshot.url}
        </p>
      ) : null}

      <p className="mt-1 text-[10px] text-white/40">
        Deep link: capítulo, progreso, nivel y debug. El laboratorio vive en
        <span className="text-white/60"> /lab/&lt;escena&gt;</span> (solo dev).
      </p>
    </aside>
  )
}
