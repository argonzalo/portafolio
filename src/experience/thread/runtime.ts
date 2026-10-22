import { Color, MathUtils, Vector3 } from "three"
import { experienceStore } from "../store"
import type { QualityTier } from "../types"
import { getSceneByChapter } from "@/scenes/registry"
import { createThreadClock } from "./clock"
import {
  CHAPTER_SEQUENCE,
  THREAD_HANDOFF_START,
  chapterIndexOf,
  chapterThreadProfile,
  createThreadFrame,
  fallbackForm,
  nextJourneyChapter,
  sampleForm,
} from "./forms"
import type { ThreadExtent } from "./path"

/** Shared world-space attractor; read in useFrame. Hidden when Stage unmounts. */
export const threadTip = { position: new Vector3(), visible: false }

const CUMULATIVE_FLOW: number[] = []
const CUMULATIVE_TIME: number[] = []
{
  let accFlow = 0
  let accTime = 0
  for (const id of CHAPTER_SEQUENCE) {
    CUMULATIVE_FLOW.push(accFlow)
    CUMULATIVE_TIME.push(accTime)
    const speed = chapterThreadProfile(id).speed
    accFlow += speed * 0.15
    accTime += speed * 4
  }
}

export function createRuntime() {
  return {
    clock: createThreadClock(),
    frame: createThreadFrame(),
    target: createThreadFrame(),
    nextTarget: createThreadFrame(),
    scratchLineNext: new Color(),
    scratchHeadNext: new Color(),
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
  const {
    clock,
    frame,
    target,
    nextTarget,
    scratchLineNext,
    scratchHeadNext,
  } = runtime
  const chapter = chapterId ?? "hero"
  const progress = experienceStore.progress(chapter).current
  const form = getSceneByChapter(chapter)?.thread ?? fallbackForm(chapter)
  const profile = chapterThreadProfile(chapter)

  sampleForm(form, progress, extent.x, extent.y, target.points)
  target.color.set(profile.lineColor ?? form.color)
  target.head.set(profile.head)
  target.lightMix = profile.scheme === "light" ? 1 : 0

  const nextChapter = nextJourneyChapter(chapter)
  let handoff = 0
  let targetMix = profile.mix

  if (nextChapter && progress > THREAD_HANDOFF_START) {
    const raw = MathUtils.clamp(
      (progress - THREAD_HANDOFF_START) / (1 - THREAD_HANDOFF_START),
      0,
      1
    )
    handoff = reducedMotion
      ? raw < 0.5
        ? 0
        : 1
      : MathUtils.smoothstep(raw, 0, 1)

    const nextForm =
      getSceneByChapter(nextChapter)?.thread ?? fallbackForm(nextChapter)
    const nextProfile = chapterThreadProfile(nextChapter)

    // En p=1 el hilo ya converge a la curva, color y energía de entrada (p=0) del capítulo siguiente.
    sampleForm(nextForm, 0, extent.x, extent.y, nextTarget.points)
    for (let i = 0; i < target.points.length; i++) {
      target.points[i].lerp(nextTarget.points[i], handoff)
    }

    scratchLineNext.set(nextProfile.lineColor ?? nextForm.color)
    scratchHeadNext.set(nextProfile.head)
    target.color.lerp(scratchLineNext, handoff)
    target.head.lerp(scratchHeadNext, handoff)
    target.lightMix = MathUtils.lerp(
      target.lightMix,
      nextProfile.scheme === "light" ? 1 : 0,
      handoff
    )
    targetMix = MathUtils.lerp(profile.mix, nextProfile.mix, handoff)
  }

  const blend =
    !runtime.initialized || reducedMotion
      ? 1
      : 1 - Math.exp(-Math.min(delta, 0.05) * 10)

  frame.points.forEach((point, index) =>
    point.lerp(target.points[index], blend)
  )
  frame.color.lerp(target.color, blend)
  frame.head.lerp(target.head, blend)
  frame.lightMix = MathUtils.lerp(frame.lightMix, target.lightMix, blend)

  // Fase continua en el círculo [0..1): en el tramo 0.82..1 cruza hacia 1.08 (= 0.08 mod 1),
  // coincidiendo sin salto con el inicio (0.08) del capítulo entrante.
  const localPhase = nextChapter
    ? progress <= THREAD_HANDOFF_START
      ? 0.08 + (progress / THREAD_HANDOFF_START) * 0.78
      : 0.86 + handoff * 0.22
    : 0.08 + progress * 0.84
  const targetPhase = ((localPhase % 1) + 1) % 1

  const idx = chapterIndexOf(chapter)
  const targetFlow =
    (((CUMULATIVE_FLOW[idx] ?? 0) + progress * profile.speed * 0.15) % 1 + 1) %
    1
  const targetTime = (CUMULATIVE_TIME[idx] ?? 0) + progress * profile.speed * 4

  if (!runtime.initialized || reducedMotion) {
    clock.phase = targetPhase
    clock.flow = targetFlow
    clock.time = targetTime
    clock.mix = targetMix
  } else {
    const phaseDelta = ((targetPhase - clock.phase + 1.5) % 1) - 0.5
    clock.phase = (((clock.phase + phaseDelta * blend) % 1) + 1) % 1

    const flowDelta = ((targetFlow - clock.flow + 1.5) % 1) - 0.5
    clock.flow = (((clock.flow + flowDelta * blend) % 1) + 1) % 1

    clock.time = MathUtils.lerp(clock.time, targetTime, blend)
    clock.mix = MathUtils.lerp(clock.mix, targetMix, blend)
  }

  clock.draw = 1
  runtime.initialized = true

  const index = clock.phase * (frame.points.length - 1)
  threadTip.position
    .copy(frame.points[Math.floor(index)])
    .lerp(frame.points[Math.ceil(index)], index % 1)
  threadTip.position.y += extent.offsetY
  threadTip.visible = chapterId !== null && quality !== "static"
}
