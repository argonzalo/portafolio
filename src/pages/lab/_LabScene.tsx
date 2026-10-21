import {
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react"
import { Canvas } from "@react-three/fiber"

import { DebugOverlay, QualityMonitor } from "@/experience/debug"
import { GpuStatsProbe } from "@/experience/GpuStatsProbe"
import { useExperienceStore } from "@/experience/hooks"
import {
  initQuality,
  QUALITY_DPR,
  syncQualityWithPreferences,
} from "@/experience/quality"
import { SceneDirector } from "@/experience/SceneDirector"
import { experienceStore } from "@/experience/store"

type Props = {
  chapterId: string
  label: string
  accent: string
}

/**
 * Escena aislada para iterar: slider 0..1, sin scroll ni capítulos reales.
 * El nivel se fuerza desde el panel de debug (botones high/medium/low/static).
 */
export function LabScene({ chapterId, label, accent }: Props) {
  const { quality } = useExperienceStore()
  const [progress, setProgress] = useState(0)
  const render3d = quality !== "static"

  useEffect(() => {
    initQuality()

    const media = window.matchMedia("(max-width: 768px)")
    const syncLayout = () => {
      experienceStore.setIsMobile(media.matches)
      syncQualityWithPreferences()
    }

    syncLayout()
    media.addEventListener("change", syncLayout)

    experienceStore.setChapter(chapterId)

    return () => {
      media.removeEventListener("change", syncLayout)
      experienceStore.resetProgress(chapterId)
      experienceStore.setChapter(null)
    }
  }, [chapterId])

  const updateProgress = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value)

    setProgress(value)
    experienceStore.setProgress(chapterId, value)
  }

  return (
    <div
      className="fixed inset-0"
      data-lab-scene={chapterId}
      data-lab-progress={progress.toFixed(2)}
      data-lab-quality={quality}
    >
      {render3d ? (
        <Canvas
          frameloop="always"
          dpr={QUALITY_DPR[quality]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#0a0a0b"]} />
          <SceneDirector />
          <QualityMonitor />
          <GpuStatsProbe />
        </Canvas>
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center p-3">
        <div className="pointer-events-auto flex w-full max-w-lg flex-col gap-2 rounded-lg border border-white/15 bg-black/75 p-3 font-mono text-[12px] text-white/90 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold tracking-wide uppercase">
              Lab · {label}
            </p>
            <a
              href="/"
              className="text-[11px] text-white/60 underline-offset-2 hover:text-white hover:underline"
            >
              volver al sitio
            </a>
          </div>

          <label className="flex items-center gap-2 text-white/70">
            <span className="w-16 shrink-0">progreso</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={updateProgress}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-[var(--lab-accent)]"
              style={{ "--lab-accent": accent } as CSSProperties}
              aria-label="Progreso del capítulo"
            />
            <output className="w-10 shrink-0 text-right text-white">
              {progress.toFixed(2)}
            </output>
          </label>

          <p className="text-[10px] leading-relaxed text-white/45">
            Forzá el nivel y mirá las métricas en el panel de debug. En mobile
            usá DevTools con CPU ×4 para verificar la histéresis.
          </p>
        </div>
      </div>

      <DebugOverlay alwaysVisible />
    </div>
  )
}
