import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import type { ExperienceStore } from "@/experience/store"
import { emitScrollReverse } from "@/guide/signals"

gsap.registerPlugin(ScrollTrigger)
export type BindChapterScrollOptions = { root?: ParentNode }

/** A single damped document cursor drives every chapter. Damping independent
 * progress values would leave the old chapter at .98 when the next becomes active.
 * Native scrolling is untouched; only the visual playhead is softened.
 */
export function bindChapterScroll(
  store: ExperienceStore,
  options: BindChapterScrollOptions = {}
) {
  const sections = Array.from(
    (options.root ?? document).querySelectorAll<HTMLElement>("[data-chapter]")
  )
  if (!sections.length) {
    store.setChapter(null)
    return () => {}
  }
  const tracks = sections.flatMap((section) => {
    const id = section.dataset.chapter
    if (!id) return []
    return [
      {
        id,
        trigger: ScrollTrigger.create({
          trigger: section,
          start: "top center",
          end: "bottom center",
        }),
      },
    ]
  })
  ScrollTrigger.refresh()
  let cursor = window.scrollY
  let lastTime = 0
  let frame = 0
  let previousChapter: string | null = null
  let reverseDistance = 0
  const onSeek = () => {
    cursor = window.scrollY
  }
  window.addEventListener("experience:seek", onSeek)
  const tick = (time: number) => {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1
    lastTime = time
    const previous = cursor
    cursor +=
      (window.scrollY - cursor) *
      (store.getSnapshot().reducedMotion ? 1 : 1 - Math.exp(-dt / 0.12))
    if (Math.abs(window.scrollY - cursor) < 0.1) cursor = window.scrollY
    const active =
      tracks.find(
        ({ trigger }) => cursor >= trigger.start && cursor < trigger.end
      ) ??
      (cursor < tracks[0].trigger.start ? tracks[0] : tracks[tracks.length - 1])
    // Commit all progress refs before publishing the discrete chapter change.
    for (const { id, trigger } of tracks)
      store.setProgress(
        id,
        (cursor - trigger.start) / (trigger.end - trigger.start)
      )
    store.setChapter(active.id)
    if (previousChapter !== active.id || cursor >= previous) reverseDistance = 0
    else reverseDistance += previous - cursor
    if (reverseDistance > window.innerHeight * 0.2) {
      emitScrollReverse(active.id)
      reverseDistance = 0
    }
    previousChapter = active.id
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener("experience:seek", onSeek)
    tracks.forEach(({ trigger }) => trigger.kill())
  }
}

export function mountChapterScroll(store: ExperienceStore) {
  let unbind = bindChapterScroll(store)
  const onPageLoad = () => {
    unbind()
    unbind = bindChapterScroll(store)
  }
  document.addEventListener("astro:page-load", onPageLoad)
  return () => {
    document.removeEventListener("astro:page-load", onPageLoad)
    unbind()
  }
}
