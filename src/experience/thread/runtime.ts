import { Color, MathUtils, Vector3 } from "three"
import { experienceStore } from "../store"
import type { QualityTier } from "../types"
import { getSceneByChapter } from "@/scenes/registry"
import { createThreadClock } from "./clock"
import { ease, handoffStart } from "@/experience/choreography"
import {
  CHAPTER_SEQUENCE,
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

/** El hilo ocupa el espacio editorial libre: nunca se tapa con paneles DOM.
 * La misma curva se usa al entrar y durante el handoff del capítulo anterior. */
function editorialPath(
  chapter: string,
  extent: ThreadExtent,
  points: Vector3[]
) {
  if (chapter !== "hero" && chapter !== "manifesto") return
  const halfWidth = extent.x / (extent.portrait ? 0.41 : 0.4) / 2
  const halfHeight = extent.portrait ? extent.offsetY * 5 : extent.y / 0.52
  points.forEach((point, i) => {
    const u = i / (points.length - 1)
    const arc = Math.sin(u * Math.PI)
    const x = extent.portrait
      ? 0.965 - arc * 0.025
      : chapter === "hero"
        ? 0.4 + arc * 0.48
        : 0.53 + arc * 0.4
    point.set(x * halfWidth, (0.8 - u * 1.6) * halfHeight - extent.offsetY, 0)
  })
}

export function updateThread(
  runtime: ReturnType<typeof createRuntime>,
  chapterId: string | null,
  quality: QualityTier,
  reducedMotion: boolean,
  extent: ThreadExtent,
  delta: number
) {
  void delta // Kept for the lab renderer API; journey damping happens in scroll.ts.
  const { clock, frame, target, nextTarget, scratchLineNext, scratchHeadNext } =
    runtime
  const chapter = chapterId ?? "hero"
  const progress = experienceStore.progress(chapter).current
  const form = getSceneByChapter(chapter)?.thread ?? fallbackForm(chapter)
  const profile = chapterThreadProfile(chapter)

  sampleForm(form, progress, extent.x, extent.y, target.points)
  editorialPath(chapter, extent, target.points)
  target.color.set(profile.lineColor ?? form.color)
  target.head.set(profile.head)
  target.lightMix = profile.scheme === "light" ? 1 : 0

  const nextChapter = nextJourneyChapter(chapter)
  const transitionStart = handoffStart(chapter)
  let handoff = 0
  let targetMix = profile.mix

  if (nextChapter && progress > transitionStart) {
    const raw = MathUtils.clamp(
      (progress - transitionStart) / (1 - transitionStart),
      0,
      1
    )
    handoff = reducedMotion ? (raw < 0.5 ? 0 : 1) : ease(raw)

    const nextForm =
      getSceneByChapter(nextChapter)?.thread ?? fallbackForm(nextChapter)
    const nextProfile = chapterThreadProfile(nextChapter)

    // En p=1 el hilo ya converge a la curva, color y energía de entrada (p=0) del capítulo siguiente.
    sampleForm(nextForm, 0, extent.x, extent.y, nextTarget.points)
    editorialPath(nextChapter, extent, nextTarget.points)
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

  // The document playhead is already damped. A second filter would make the
  // thread trail behind the world/camera and break reversible scrubbing.
  const blend = 1

  frame.points.forEach((point, index) =>
    point.lerp(target.points[index], blend)
  )
  frame.color.lerp(target.color, blend)
  frame.head.lerp(target.head, blend)
  frame.lightMix = MathUtils.lerp(frame.lightMix, target.lightMix, blend)

  // Fase continua en el círculo [0..1): durante el handoff cruza hacia 1.08 (= 0.08 mod 1),
  // coincidiendo sin salto con el inicio (0.08) del capítulo entrante.
  const localPhase = nextChapter
    ? progress <= transitionStart
      ? 0.08 + (progress / transitionStart) * 0.78
      : 0.86 + handoff * 0.22
    : 0.08 + progress * 0.84
  const targetPhase = ((localPhase % 1) + 1) % 1

  const idx = chapterIndexOf(chapter)
  const targetFlow =
    ((((CUMULATIVE_FLOW[idx] ?? 0) + progress * profile.speed * 0.15) % 1) +
      1) %
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
