import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"

import { GpuStatsProbe } from "@/experience/GpuStatsProbe"
import { MemoryHud } from "@/experience/MemoryHud"
import { SceneDirector } from "@/experience/SceneDirector"
import { experienceStore } from "@/experience/store"
import { mountChapterScroll } from "@/experience/scroll"
import { connectStoreSignals } from "@/guide/signals"

type Frameloop = "always" | "demand" | "never"

/**
 * Canvas WebGL único y persistente (ADR-002 / T-A06).
 *
 * Se monta una vez en el layout con `transition:persist`. Monta como máximo
 * dos escenas, escribe el scroll en el store y pausa el loop con la pestaña
 * oculta.
 */
export function Stage() {
  const [frameloop, setFrameloop] = useState<Frameloop>("always")

  useEffect(() => {
    const disconnectSignals = connectStoreSignals(experienceStore)
    const unbindScroll = mountChapterScroll(experienceStore)

    const media = window.matchMedia("(max-width: 768px)")
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")

    const syncFlags = () => {
      experienceStore.setIsMobile(media.matches)
      experienceStore.setReducedMotion(motion.matches)
    }

    syncFlags()
    media.addEventListener("change", syncFlags)
    motion.addEventListener("change", syncFlags)

    const onVisibility = () => {
      setFrameloop(document.hidden ? "never" : "always")
    }

    document.addEventListener("visibilitychange", onVisibility)
    onVisibility()

    return () => {
      disconnectSignals()
      unbindScroll()
      media.removeEventListener("change", syncFlags)
      motion.removeEventListener("change", syncFlags)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
        data-experience-stage
      >
        <Canvas
          frameloop={frameloop}
          dpr={[1, 1.5]}
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
          <GpuStatsProbe />
        </Canvas>
      </div>
      <MemoryHud />
    </>
  )
}
