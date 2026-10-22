import { useEffect, useMemo, useRef } from "react"
import type { Group } from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { useExperienceStore } from "../hooks"
import { getQualityState } from "../quality"
import { experienceStore } from "../store"
import { Filament } from "./filament/Filament"
import { Swarm } from "./swarm/Swarm"
import { createRuntime, updateThread, threadTip } from "./runtime"
import { useThreadExtent } from "./useThreadExtent"

/** Same curve, clock and tip survive renderer/quality/viewport changes. */
export function Thread() {
  const { chapterId, quality, reducedMotion } = useExperienceStore()
  const size = useThree((state) => state.size)
  const extent = useThreadExtent()
  const runtime = useMemo(() => createRuntime(), [])
  const root = useRef<Group>(null)
  const filament =
    size.width <= 768 ||
    size.width <= size.height ||
    quality === "low" ||
    reducedMotion ||
    (quality === "medium" && getQualityState().reason === "adaptive")

  useEffect(
    () => () => {
      threadTip.visible = false
    },
    []
  )

  // Before the renderers read uniforms; no state updates or timers per frame.
  useFrame((_, delta) => {
    updateThread(runtime, chapterId, quality, reducedMotion, extent, delta)
    // Pirp cede el foco a las noticias agrupadas; el reloj sigue siendo continuo.
    const p = chapterId ? experienceStore.progress(chapterId).current : 0
    const visible = chapterId !== "pirp" || p < 0.38 || p > 0.62
    if (root.current) root.current.visible = visible
    threadTip.visible = threadTip.visible && visible
  }, -1)

  if (quality === "static" || !chapterId) return null
  return (
    <group ref={root}>
      {filament ? (
        <Filament clock={runtime.clock} tier={quality} frame={runtime.frame} />
      ) : (
        <Swarm clock={runtime.clock} tier={quality} frame={runtime.frame} />
      )}
    </group>
  )
}
