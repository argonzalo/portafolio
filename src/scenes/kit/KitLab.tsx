import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react"
import { Canvas } from "@react-three/fiber"
import { MathUtils } from "three"

import { DebugOverlay, QualityMonitor } from "@/experience/debug"
import { GpuStatsProbe } from "@/experience/GpuStatsProbe"
import { useExperienceStore } from "@/experience/hooks"
import {
  forceQuality,
  initQuality,
  isQualityTier,
  QUALITY_DPR,
  syncQualityWithPreferences,
} from "@/experience/quality"
import { setGpuStats } from "@/experience/gpuStats"
import { experienceStore } from "@/experience/store"
import { emitInteract } from "@/guide/signals"

import KitShowcaseScene from "./KitShowcaseScene"
import {
  getKitTheme,
  KIT_LAB_BEATS,
  KIT_THEMES,
  type KitPresetId,
} from "./theme"

const CHAPTER_ID = "kit"

const PRESETS: readonly KitPresetId[] = ["vibo", "pirp", "naturalis", "banner"]

type KitLabParams = {
  progress: number
  preset: KitPresetId
  frame: boolean
}

function readLabParams(): KitLabParams {
  if (typeof window === "undefined") {
    return { progress: 0.33, preset: "vibo", frame: false }
  }
  const params = new URLSearchParams(window.location.search)
  const rawProgress = Number(params.get("progress"))
  const progress =
    params.has("progress") && Number.isFinite(rawProgress)
      ? MathUtils.clamp(rawProgress, 0, 1)
      : 0.33
  const rawPreset = params.get("preset")
  const preset: KitPresetId =
    rawPreset && rawPreset in KIT_THEMES
      ? (rawPreset as KitPresetId)
      : "vibo"
  const frame = params.get("frame") === "mobile"
  return { progress, preset, frame }
}

function writeLabParams(next: Partial<KitLabParams>): void {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (next.progress !== undefined) {
    url.searchParams.set("progress", next.progress.toFixed(2))
  }
  if (next.preset !== undefined) {
    url.searchParams.set("preset", next.preset)
  }
  if (next.frame !== undefined) {
    if (next.frame) url.searchParams.set("frame", "mobile")
    else url.searchParams.delete("frame")
  }
  window.history.replaceState(window.history.state, "", url)
}

/**
 * Laboratorio interactivo del Kit de Escena (`/lab/kit`, T-A18).
 *
 * Permite inspeccionar en vivo todas las piezas reutilizables:
 * - Rig de cámara por beats (`useBeatCameraRig`)
 * - Líneas y trayectorias con el shader del hilo (`ThreadLine`)
 * - HUD anclado a coordenadas 3D + Pose + Bounding Box (`HudOverlay`)
 * - Grafo de nodos / agentes con pulsos y decisiones (`AgentGraph`)
 * - Contadores numéricos, barras y curva de tendencia (`TelemetryDeck`)
 * - Campo de partículas GPU por nivel (`ParticleField`)
 * - Kit de dispositivos 3D (`Phone`, `Laptop`, `Display`) con pantallas y capas flotantes (T-A19)
 */
export function KitLab() {
  const { quality, isMobile: viewportMobile } = useExperienceStore()
  const [params, setParams] = useState<KitLabParams>(readLabParams)
  const [controlsCollapsed, setControlsCollapsed] = useState(false)

  const progressRef = useMemo(() => experienceStore.progress(CHAPTER_ID), [])
  const theme = getKitTheme(params.preset)
  const render3d = quality !== "static"
  const effectiveMobile = viewportMobile || params.frame

  const activeBeat =
    KIT_LAB_BEATS.find(
      (b) =>
        params.progress >= b.range[0] &&
        (params.progress < b.range[1] || b.range[1] === 1)
    ) ?? KIT_LAB_BEATS[0]

  useEffect(() => {
    initQuality()
    const search = new URLSearchParams(window.location.search)
    const tier = search.get("quality")
    if (isQualityTier(tier)) {
      forceQuality(tier)
    }

    const initial = readLabParams()
    queueMicrotask(() => setParams(initial))
    experienceStore.setProgress(CHAPTER_ID, initial.progress)
    experienceStore.setChapter(CHAPTER_ID)

    const media = window.matchMedia("(max-width: 768px)")
    const syncLayout = () => {
      experienceStore.setIsMobile(media.matches)
      syncQualityWithPreferences()
    }

    syncLayout()
    media.addEventListener("change", syncLayout)

    return () => {
      media.removeEventListener("change", syncLayout)
      experienceStore.resetProgress(CHAPTER_ID)
      experienceStore.setChapter(null)
      experienceStore.setBeat(null)
    }
  }, [])

  useEffect(() => {
    setGpuStats({ mountedScenes: render3d ? 1 : 0 })
    return () => {
      setGpuStats({ mountedScenes: 0 })
    }
  }, [render3d])

  useEffect(() => {
    experienceStore.setBeat({
      sceneId: "vibo",
      beatId: activeBeat.id,
    })
  }, [activeBeat.id])

  const applyProgress = (value: number) => {
    const clamped = MathUtils.clamp(value, 0, 1)
    setParams((prev) => ({ ...prev, progress: clamped }))
    experienceStore.setProgress(CHAPTER_ID, clamped)
    writeLabParams({ progress: clamped })
  }

  const onSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    applyProgress(Number(event.currentTarget.value))
  }

  const selectPreset = (preset: KitPresetId) => {
    setParams((prev) => ({ ...prev, preset }))
    writeLabParams({ preset })
    emitInteract(`kit:preset:${preset}`)
  }

  const toggleMobileFrame = () => {
    setParams((prev) => {
      const nextFrame = !prev.frame
      writeLabParams({ frame: nextFrame })
      return { ...prev, frame: nextFrame }
    })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: theme.background, color: theme.text }}
      data-lab-scene="kit"
      data-lab-preset={params.preset}
      data-lab-progress={params.progress.toFixed(2)}
      data-lab-quality={quality}
    >
      <div
        className={
          params.frame
            ? "relative h-[min(844px,calc(100svh-1.5rem))] w-[min(390px,100vw)] overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl"
            : "absolute inset-0"
        }
        data-lab-frame={params.frame ? "mobile" : "full"}
      >
        {render3d ? (
          <Canvas
            frameloop="always"
            dpr={QUALITY_DPR[quality]}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            camera={{ position: [5.4, 3.2, 6.8], fov: 42, near: 0.1, far: 100 }}
            style={{ width: "100%", height: "100%" }}
          >
            <color attach="background" args={[theme.background]} />
            <KitShowcaseScene
              progress={progressRef}
              quality={quality}
              isMobile={effectiveMobile}
              active
              theme={theme}
            />
            <QualityMonitor />
            <GpuStatsProbe />
          </Canvas>
        ) : (
          <picture className="block h-full w-full">
            <source
              media="(max-width:768px)"
              srcSet="/posters/greybox/kit-mobile.png"
            />
            <img
              src="/posters/greybox/kit.png"
              alt={`Vista estática del Kit de Escena (${theme.label})`}
              className="h-full w-full object-cover"
            />
          </picture>
        )}
      </div>

      {/* Panel de control del laboratorio (arriba-izquierda para no tapar el HUD ni las tarjetas) */}
      <div
        data-kit-lab-controls
        className="pointer-events-none fixed top-0 left-0 z-40 w-full max-w-md p-3"
      >
        <div
          className="pointer-events-auto flex flex-col gap-2.5 rounded-lg p-3 font-mono text-[11px] backdrop-blur-md"
          style={{
            background:
              theme.scheme === "light"
                ? "rgba(255, 255, 255, 0.92)"
                : "rgba(9, 13, 22, 0.84)",
            border: `1px solid ${theme.border}`,
            color: theme.text,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.28)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase">
                Lab · Kit de escena + dispositivos (T-A18 / T-A19)
              </p>
              <p
                className="text-[10px]"
                style={{ color: theme.textMuted }}
              >
                {activeBeat.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setControlsCollapsed((v) => !v)}
                className="min-h-9 cursor-pointer rounded border px-2 py-1 text-[10px]"
                style={{
                  borderColor: theme.border,
                  color: theme.textMuted,
                }}
              >
                {controlsCollapsed ? "Expandir" : "Compactar"}
              </button>
              <a
                href="/"
                data-astro-prefetch="false"
                className="text-[11px] underline-offset-2 hover:underline"
                style={{ color: theme.accent }}
              >
                sitio
              </a>
            </div>
          </div>

          {/* Slider de progreso 0..1 */}
          <label className="flex items-center gap-2">
            <span
              className="w-16 shrink-0 text-[11px]"
              style={{ color: theme.textMuted }}
            >
              progreso
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={params.progress}
              onChange={onSliderChange}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-current/20 accent-[var(--lab-accent)]"
              style={{ "--lab-accent": theme.accent } as CSSProperties}
              aria-label="Progreso del capítulo"
            />
            <output
              className="w-10 shrink-0 text-right font-semibold"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {params.progress.toFixed(2)}
            </output>
          </label>

          {!controlsCollapsed ? (
            <>
              {/* Selector de Beat (5 piezas del kit) */}
              <div
                className="grid grid-cols-5 gap-1"
                role="group"
                aria-label="Beats de demostración del kit"
              >
                {KIT_LAB_BEATS.map((beat, idx) => {
                  const isCurrent = activeBeat.id === beat.id
                  return (
                    <button
                      key={beat.id}
                      type="button"
                      data-kit-beat={beat.id}
                      aria-pressed={isCurrent}
                      onClick={() => applyProgress(beat.progress)}
                      className="min-h-11 cursor-pointer rounded px-1.5 py-1 text-center text-[10px] font-medium transition-colors"
                      style={{
                        background: isCurrent
                          ? theme.glowColor
                          : "transparent",
                        border: `1px solid ${
                          isCurrent ? theme.borderStrong : theme.border
                        }`,
                        color: isCurrent ? theme.accent : theme.textMuted,
                      }}
                    >
                      B0{idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Selector de paleta de escena (Vibo / Pirp / Naturalis / Banner) */}
              <div
                className="grid grid-cols-4 gap-1"
                role="group"
                aria-label="Paleta de escena"
              >
                {PRESETS.map((presetId) => {
                  const isCurrent = params.preset === presetId
                  const pTheme = KIT_THEMES[presetId]
                  return (
                    <button
                      key={presetId}
                      type="button"
                      aria-pressed={isCurrent}
                      onClick={() => selectPreset(presetId)}
                      className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded px-2 py-1 text-[10px] font-medium capitalize transition-colors"
                      style={{
                        background: isCurrent
                          ? theme.glowColor
                          : "transparent",
                        border: `1px solid ${
                          isCurrent ? theme.borderStrong : theme.border
                        }`,
                        color: isCurrent ? theme.text : theme.textMuted,
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: pTheme.primary }}
                      />
                      {presetId}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5 text-[10px]">
                <span style={{ color: theme.textMuted }}>{theme.tagline}</span>
                <button
                  type="button"
                  aria-pressed={params.frame}
                  onClick={toggleMobileFrame}
                  className="hidden min-h-9 shrink-0 cursor-pointer rounded border px-2 py-1 sm:inline-flex sm:items-center"
                  style={{
                    borderColor: params.frame
                      ? theme.borderStrong
                      : theme.border,
                    color: params.frame ? theme.accent : theme.textMuted,
                  }}
                >
                  {params.frame ? "100% viewport" : "390×844"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <DebugOverlay alwaysVisible />
    </div>
  )
}
