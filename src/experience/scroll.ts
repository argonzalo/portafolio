import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import type { ExperienceStore } from "@/experience/store"
import { emitScrollReverse } from "@/guide/signals"

gsap.registerPlugin(ScrollTrigger)

const CHAPTER_SELECTOR = "[data-chapter]"

export type BindChapterScrollOptions = {
  /** Raíz donde buscar capítulos. Por defecto `document`. */
  root?: ParentNode
}

/**
 * ScrollTrigger → store (`01-arquitectura.md` §2).
 *
 * Cada `[data-chapter]` escribe su progreso 0..1 en el store sin provocar
 * renders de React. El capítulo activo se actualiza cuando el trigger está
 * en zona (onToggle / onUpdate).
 *
 * Re-llamar tras `astro:page-load`: destruye los triggers previos.
 */
export function bindChapterScroll(
  store: ExperienceStore,
  options: BindChapterScrollOptions = {}
): () => void {
  const root = options.root ?? document
  const sections = Array.from(
    root.querySelectorAll<HTMLElement>(CHAPTER_SELECTOR)
  )

  if (sections.length === 0) {
    store.setChapter(null)
    return () => {
      /* nada que limpiar */
    }
  }

  const lastProgress = new Map<string, number>()
  const triggers: ScrollTrigger[] = []

  for (const section of sections) {
    const chapterId = section.dataset.chapter

    if (!chapterId) {
      continue
    }

    lastProgress.set(chapterId, 0)

    const trigger = ScrollTrigger.create({
      trigger: section,
      // Zona “capítulo activo”: el bloque cruza el centro del viewport.
      start: "top center",
      end: "bottom center",
      scrub: true,
      onUpdate: (self) => {
        const previous = lastProgress.get(chapterId) ?? 0
        const next = self.progress

        store.setProgress(chapterId, next)

        if (
          next < previous - 0.02 &&
          store.getSnapshot().chapterId === chapterId
        ) {
          emitScrollReverse(chapterId)
        }

        lastProgress.set(chapterId, next)
      },
      onToggle: (self) => {
        if (self.isActive) {
          store.setChapter(chapterId)
        }
      },
    })

    triggers.push(trigger)
  }

  // Capítulo inicial: el que esté más centrado en el viewport.
  const initial = pickActiveChapter(sections)
  if (initial) {
    store.setChapter(initial)
  }

  ScrollTrigger.refresh()

  return () => {
    for (const trigger of triggers) {
      trigger.kill()
    }
  }
}

function pickActiveChapter(sections: HTMLElement[]): string | null {
  const viewportMid = window.innerHeight * 0.45
  let best: { id: string; distance: number } | null = null

  for (const section of sections) {
    const id = section.dataset.chapter
    if (!id) continue

    const rect = section.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) continue

    const mid = (rect.top + rect.bottom) / 2
    const distance = Math.abs(mid - viewportMid)

    if (!best || distance < best.distance) {
      best = { id, distance }
    }
  }

  return best?.id ?? sections[0]?.dataset.chapter ?? null
}

/**
 * Engancha `bindChapterScroll` al ciclo de View Transitions de Astro.
 * Devuelve cleanup global (quita listeners + mata triggers actuales).
 */
export function mountChapterScroll(store: ExperienceStore): () => void {
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
