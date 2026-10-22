import { Thread } from "@/experience/thread/Thread"
import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Color } from "three"

import { DebugOverlay, QualityMonitor } from "@/experience/debug"
import { mountDeepLinks } from "@/experience/deepLink"
import { GpuStatsProbe } from "@/experience/GpuStatsProbe"
import { useExperienceStore } from "@/experience/hooks"
import {
  initQuality,
  QUALITY_DPR,
  syncQualityWithPreferences,
} from "@/experience/quality"
import {
  getLivePalette,
  mountPalette,
  SITE_PALETTE,
} from "@/experience/palette"
import { SceneDirector } from "@/experience/SceneDirector"
import { experienceStore } from "@/experience/store"
import { mountChapterScroll } from "@/experience/scroll"
import { connectStoreSignals } from "@/guide/signals"

/**
 * Fondo WebGL alineado a la paleta viva (T-A15). Prioridad negativa: corre
 * después de los rigs de escena que aún escriben `scene.background` fijo.
 */
function PaletteBackground() {
  const color = useRef<Color>(null)

  useFrame(() => {
    color.current?.set(getLivePalette().background)
  }, -1)

  return (
    <color ref={color} attach="background" args={[SITE_PALETTE.background]} />
  )
}

type Frameloop = "always" | "demand" | "never"

type ConnectionLike = {
  addEventListener?: (type: "change", listener: () => void) => void
  removeEventListener?: (type: "change", listener: () => void) => void
}

/**
 * Canvas WebGL único y persistente (ADR-002 / T-A06).
 *
 * Se monta una vez en el layout con `transition:persist`. Monta como máximo
 * dos escenas, escribe el scroll en el store y pausa el loop con la pestaña
 * oculta. En nivel `static` (sin WebGL, movimiento reducido, Save-Data o caída
 * sostenida de FPS) no se monta canvas: los pósters llegan con T-A16.
 */
export function Stage() {
  const [frameloop, setFrameloop] = useState<Frameloop>("always")
  const { quality } = useExperienceStore()
  const render3d = quality !== "static"

  useEffect(() => {
    initQuality()

    const disconnectSignals = connectStoreSignals(experienceStore)
    const unbindScroll = mountChapterScroll(experienceStore)
    const unmountDeepLinks = mountDeepLinks(experienceStore)
    const unbindPalette = mountPalette(experienceStore)

    const media = window.matchMedia("(max-width: 768px)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const connection = (
      navigator as Navigator & { connection?: ConnectionLike }
    ).connection

    const syncLayout = () => {
      experienceStore.setIsMobile(media.matches)
      // Actualiza el ancho/techo de calidad sin resetear un nivel adaptado.
      syncQualityWithPreferences()
    }

    const syncPreferences = () => {
      experienceStore.setReducedMotion(motion.matches)
      syncQualityWithPreferences()
    }

    syncLayout()
    syncPreferences()
    media.addEventListener("change", syncLayout)
    motion.addEventListener("change", syncPreferences)
    connection?.addEventListener?.("change", syncPreferences)

    const onVisibility = () => {
      setFrameloop(document.hidden ? "never" : "always")
    }

    document.addEventListener("visibilitychange", onVisibility)
    onVisibility()

    return () => {
      unbindPalette()
      unmountDeepLinks()
      disconnectSignals()
      unbindScroll()
      media.removeEventListener("change", syncLayout)
      motion.removeEventListener("change", syncPreferences)
      connection?.removeEventListener?.("change", syncPreferences)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <>
      {render3d ? (
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          aria-hidden="true"
          data-experience-stage
          data-experience-quality={quality}
        >
          <Canvas
            frameloop={frameloop}
            dpr={QUALITY_DPR[quality]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
            camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 100 }}
            style={{ width: "100%", height: "100%" }}
          >
            <PaletteBackground />
            <SceneDirector />
            <Thread />
            <QualityMonitor />
            <GpuStatsProbe />
          </Canvas>
        </div>
      ) : null}
      <DebugOverlay />
    </>
  )
}
