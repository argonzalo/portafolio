import { Vector3 } from "three"
import { experienceStore } from "../store"
import type { QualityTier } from "../types"
import { getSceneByChapter } from "@/scenes/registry"
import { createThreadClock } from "./clock"
import { createThreadFrame, fallbackForm, sampleForm } from "./forms"
import type { ThreadExtent } from "./path"

/** Shared world-space attractor; read in useFrame. Hidden when Stage unmounts. */
export const threadTip = { position: new Vector3(), visible: false }

export function createRuntime() {
  return {
    clock: createThreadClock(),
    frame: createThreadFrame(),
    target: createThreadFrame(),
    initialized: false,
  }
}

export function updateThread(
  runtime: ReturnType<typeof createRuntime>,
  chapterId: string | null,
  quality: QualityTier,
  reducedMotion: boolean,
  extent: ThreadExtent,
  delta: number
) {
  const { clock, frame, target } = runtime
  const chapter = chapterId ?? "hero"
  const progress = experienceStore.progress(chapter).current
  const form = getSceneByChapter(chapter)?.thread ?? fallbackForm(chapter)
  sampleForm(form, progress, extent.x, extent.y, target.points)
  target.color.set(form.color)
  target.head.set(chapter === "vibo" ? "#f5c451" : "#EFE9DD")
  const blend =
    !runtime.initialized || reducedMotion
      ? 1
      : 1 - Math.exp(-Math.min(delta, 0.05) * 9)
  frame.points.forEach((point, index) =>
    point.lerp(target.points[index], blend)
  )
  frame.color.lerp(target.color, blend)
  frame.head.lerp(target.head, blend)
  runtime.initialized = true
  // Scroll determines the head, so seeking/reversing is reproducible.
  clock.phase += (0.08 + progress * 0.84 - clock.phase) * blend
  clock.flow = progress * 0.15
  clock.time = progress * 4
  clock.mix = 0
  clock.draw = 1
  const index = clock.phase * (frame.points.length - 1)
  threadTip.position
    .copy(frame.points[Math.floor(index)])
    .lerp(frame.points[Math.ceil(index)], index % 1)
  threadTip.position.y += extent.offsetY
  threadTip.visible = chapterId !== null && quality !== "static"
}
