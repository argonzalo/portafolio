import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Color, MathUtils } from "three"

import { DebugOverlay, QualityMonitor } from "@/experience/debug"
import { GpuStatsProbe } from "@/experience/GpuStatsProbe"
import { useExperienceStore } from "@/experience/hooks"
import {
  initQuality,
  QUALITY_DPR,
  syncQualityWithPreferences,
} from "@/experience/quality"
import { experienceStore, type ProgressRef } from "@/experience/store"

import {
  advanceThreadClock,
  createThreadClock,
  restartThreadDraw,
  type ThreadClock,
} from "./clock"
import { Filament } from "./filament/Filament"
import {
  FILAMENT_SEGMENTS,
  SWARM_PARTICLES,
  THREAD_STYLES,
  type RenderTier,
} from "./path"
import { Swarm } from "./swarm/Swarm"

/**
 * Laboratorio del hilo conductor (T-A08, ADR-006): compara la opción A
 * (filamento) y la C (enjambre) sobre la misma transición Vibo → Pirp.
 *
 * Deep link: `?option=a|c&mix=0..1&frame=mobile&autoplay`, más los de T-A07
 * (`quality`). El progreso vive en el store como el de cualquier capítulo.
 */

export type ThreadOption = "a" | "c"

const CHAPTER_ID = "lab-thread"
/** Ida y vuelta completa de la demo automática, en segundos. */
const AUTOPLAY_PERIOD = 9

const OPTIONS: { id: ThreadOption; label: string; hint: string }[] = [
  { id: "a", label: "A · filamento", hint: "listón de luz + punta" },
  { id: "c", label: "C · enjambre", hint: "partículas que se reorganizan" },
]

type LabParams = {
  option: ThreadOption
  mix: number
  frame: boolean
  autoplay: boolean
}

function readParams(): LabParams {
  const params = new URLSearchParams(window.location.search)
  const mix = Number(params.get("mix"))

  return {
    option: params.get("option") === "c" ? "c" : "a",
    mix: Number.isFinite(mix) ? MathUtils.clamp(mix, 0, 1) : 0,
    frame: params.get("frame") === "mobile",
    autoplay: params.has("autoplay"),
  }
}

function writeParams(next: LabParams): void {
  const url = new URL(window.location.href)

  url.searchParams.set("option", next.option)
  url.searchParams.set("mix", next.mix.toFixed(2))

  if (next.frame) url.searchParams.set("frame", "mobile")
  else url.searchParams.delete("frame")

  if (next.autoplay) url.searchParams.set("autoplay", "")
  else url.searchParams.delete("autoplay")

  const search = url.searchParams.toString().replace(/=(?=&|$)/g, "")
  url.search = search ? `?${search}` : ""
  window.history.replaceState(window.history.state, "", url)
}

const BACKGROUND = {
  vibo: new Color(THREAD_STYLES.vibo.background),
  pirp: new Color(THREAD_STYLES.pirp.background),
}

/** Triángulo con mesetas: se queda un rato en cada extremo para poder mirarlo. */
function autoplayValue(seconds: number): number {
  const t = (seconds % AUTOPLAY_PERIOD) / AUTOPLAY_PERIOD
  const wave = t < 0.5 ? t * 2 : (1 - t) * 2
  return MathUtils.smoothstep(wave, 0.2, 0.8)
}

type RigProps = {
  clock: ThreadClock
  progress: ProgressRef
  autoplay: boolean
  onAutoplay: (value: number) => void
}

/** Avanza el reloj del hilo y tiñe el fondo entre las paletas de Vibo y Pirp. */
function ThreadRig({ clock, progress, autoplay, onAutoplay }: RigProps) {
  const background = useRef<Color>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    if (autoplay) {
      elapsed.current += delta
      const value = autoplayValue(elapsed.current)
      experienceStore.setProgress(CHAPTER_ID, value)
      onAutoplay(value)
    }

    advanceThreadClock(clock, progress.current, delta)
    background.current?.lerpColors(
      BACKGROUND.vibo,
      BACKGROUND.pirp,
      MathUtils.smoothstep(clock.mix, 0, 1)
    )
  })

  return (
    <color
      ref={background}
      attach="background"
      args={[THREAD_STYLES.vibo.background]}
    />
  )
}

function costLabel(option: ThreadOption, tier: RenderTier): string {
  if (option === "a") {
    const segments = FILAMENT_SEGMENTS[tier]
    return `${segments} segmentos · ${(segments * 2).toLocaleString("es-AR")} triángulos · 2 draw calls`
  }

  return `${SWARM_PARTICLES[tier].toLocaleString("es-AR")} partículas · 1 draw call`
}

export function ThreadLab() {
  const { quality } = useExperienceStore()
  const [params, setParams] = useState<LabParams>(readParams)
  // En el teléfono el panel de métricas tapa el hilo: arranca plegado.
  const [showMetrics, setShowMetrics] = useState(
    () => !window.matchMedia("(max-width: 768px)").matches
  )
  const clock = useMemo(() => createThreadClock(readParams().mix), [])
  const progress = useMemo(() => experienceStore.progress(CHAPTER_ID), [])
  const slider = useRef<HTMLInputElement>(null)
  const output = useRef<HTMLOutputElement>(null)

  const render3d = quality !== "static"
  const tier: RenderTier = quality === "static" ? "low" : quality

  useEffect(() => {
    initQuality()

    const media = window.matchMedia("(max-width: 768px)")
    const syncLayout = () => {
      experienceStore.setIsMobile(media.matches)
      syncQualityWithPreferences()
    }

    syncLayout()
    media.addEventListener("change", syncLayout)
    experienceStore.setChapter(CHAPTER_ID)

    return () => {
      media.removeEventListener("change", syncLayout)
      experienceStore.resetProgress(CHAPTER_ID)
      experienceStore.setChapter(null)
    }
  }, [])

  useEffect(() => {
    experienceStore.setProgress(CHAPTER_ID, clock.mix)
  }, [clock])

  useEffect(() => {
    restartThreadDraw(clock)
  }, [clock, params.option])

  const update = (patch: Partial<LabParams>) => {
    setParams((current) => {
      const next = { ...current, ...patch }
      writeParams(next)
      return next
    })
  }

  const showMix = (value: number) => {
    if (slider.current) slider.current.value = String(value)
    if (output.current) output.current.textContent = value.toFixed(2)
  }

  const onSlide = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value)
    experienceStore.setProgress(CHAPTER_ID, value)
    showMix(value)

    if (params.autoplay) update({ autoplay: false })
  }

  // `replaceState` se limita en Safari si se llama en cada `input`: solo al soltar.
  const commitSlide = () => {
    update({ mix: progress.current })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#05070d]"
      data-lab-thread={params.option}
      data-lab-quality={quality}
    >
      <div
        className={
          params.frame
            ? "relative h-[min(844px,calc(100svh-2rem))] w-[min(390px,100vw)] overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl"
            : "absolute inset-0"
        }
        data-lab-frame={params.frame ? "mobile" : "full"}
      >
        {render3d ? (
          <Canvas
            frameloop="always"
            dpr={QUALITY_DPR[quality]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ThreadRig
              clock={clock}
              progress={progress}
              autoplay={params.autoplay}
              onAutoplay={showMix}
            />
            {params.option === "a" ? (
              <Filament clock={clock} tier={tier} />
            ) : (
              <Swarm clock={clock} tier={tier} />
            )}
            <QualityMonitor />
            <GpuStatsProbe />
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center font-mono text-xs text-white/60">
            Nivel static: sin canvas. El póster del hilo llega con T-A16.
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-[max(1rem,env(safe-area-inset-top))] flex justify-between px-5 font-mono text-[11px] tracking-wide text-white/55 uppercase sm:top-auto sm:bottom-[max(1rem,env(safe-area-inset-bottom))]">
          <span>Vibo · trayectoria</span>
          <span>Pirp · señal</span>
        </div>
      </div>

      {/* En el teléfono los controles van abajo: no tapan el hilo y quedan al alcance del pulgar. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:top-0 sm:bottom-auto">
        <div className="pointer-events-auto flex w-full max-w-lg flex-col gap-2 rounded-lg border border-white/15 bg-black/75 p-3 font-mono text-[12px] text-white/90 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold tracking-wide uppercase">
              Lab · hilo conductor
            </p>
            <a
              href="/"
              className="text-[11px] text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              volver al sitio
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Opción del hilo">
            {OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => update({ option: option.id })}
                aria-pressed={params.option === option.id}
                className={`min-h-11 cursor-pointer rounded border px-2 py-1 text-left transition-colors ${
                  params.option === option.id
                    ? "border-white/60 bg-white/15 text-white"
                    : "border-white/15 text-white/65 hover:bg-white/10"
                }`}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="block text-[10px] text-white/50">{option.hint}</span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-white/70">
            <span className="w-16 shrink-0">transición</span>
            <input
              ref={slider}
              type="range"
              min={0}
              max={1}
              step={0.01}
              defaultValue={params.mix}
              onChange={onSlide}
              onPointerUp={commitSlide}
              onKeyUp={commitSlide}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[#f5c451]"
              aria-label="Transición de Vibo a Pirp"
            />
            <output ref={output} className="w-10 shrink-0 text-right text-white">
              {params.mix.toFixed(2)}
            </output>
          </label>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => update({ autoplay: !params.autoplay })}
              aria-pressed={params.autoplay}
              className="min-h-11 cursor-pointer rounded border border-white/15 px-2 text-white/75 hover:bg-white/10 aria-pressed:border-amber-300/50 aria-pressed:text-amber-200"
            >
              {params.autoplay ? "pausar demo" : "reproducir demo"}
            </button>
            <button
              type="button"
              onClick={() => update({ frame: !params.frame })}
              aria-pressed={params.frame}
              className="hidden min-h-11 cursor-pointer rounded border border-white/15 px-2 text-white/75 hover:bg-white/10 aria-pressed:border-sky-300/50 aria-pressed:text-sky-200 sm:block"
            >
              {params.frame ? "pantalla completa" : "marco mobile 390×844"}
            </button>
            <button
              type="button"
              onClick={() => setShowMetrics((value) => !value)}
              aria-pressed={showMetrics}
              className="min-h-11 cursor-pointer rounded border border-white/15 px-2 text-white/75 hover:bg-white/10 aria-pressed:border-emerald-300/50 aria-pressed:text-emerald-200"
            >
              {showMetrics ? "ocultar métricas" : "métricas"}
            </button>
          </div>

          <p className="text-[10px] leading-relaxed text-white/45">
            {render3d ? `${tier} · ${costLabel(params.option, tier)}. ` : null}
            Compará en desktop y en el teléfono; las métricas están en el panel
            de debug.
          </p>
        </div>
      </div>

      {showMetrics ? <DebugOverlay alwaysVisible /> : null}
    </div>
  )
}
