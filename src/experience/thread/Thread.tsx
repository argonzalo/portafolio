import { useEffect, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useExperienceStore } from "../hooks"
import { getQualityState } from "../quality"
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
  }, -1)

  if (quality === "static" || !chapterId) return null
  return filament ? (
    <Filament clock={runtime.clock} tier={quality} frame={runtime.frame} />
  ) : (
    <Swarm clock={runtime.clock} tier={quality} frame={runtime.frame} />
  )
}
