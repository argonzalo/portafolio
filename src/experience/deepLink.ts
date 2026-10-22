import { forceQuality, isQualityTier } from "@/experience/quality"
import type { ExperienceStore } from "@/experience/store"
import type { QualityTier } from "@/experience/types"

/**
 * Deep links de estado (`01-arquitectura.md` §9):
 *
 * ```text
 * /?chapter=vibo&progress=0.45&quality=low&debug
 * ```
 *
 * Permiten que un agente saque capturas reproducibles de un beat exacto y que
 * el humano revise un punto del recorrido sin scrollear. El progreso se aplica
 * moviendo el scroll al punto equivalente (para que ScrollTrigger y las
 * escenas coincidan) y, además, escribiéndolo en el store por si el trigger
 * todavía no estaba listo.
 */

export type DeepLinkState = {
  chapterId: string | null
  progress: number | null
  quality: QualityTier | null
  debug: boolean
}

/** `?flag`, `?flag=1` y `?flag=true` encienden; `0`/`false` apagan. */
export function isFlagOn(params: URLSearchParams, name: string): boolean {
  if (!params.has(name)) return false

  const value = (params.get(name) ?? "").toLowerCase()
  return value !== "0" && value !== "false" && value !== "off"
}

function parseProgress(value: string | null): number | null {
  if (value === null || value.trim() === "") return null

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null

  return Math.min(1, Math.max(0, parsed))
}

export function parseDeepLink(search: string): DeepLinkState {
  const params = new URLSearchParams(search)
  const chapterId = params.get("chapter")?.trim() || null
  const quality = params.get("quality")

  return {
    chapterId,
    progress: parseProgress(params.get("progress")),
    quality: isQualityTier(quality) ? quality : null,
    debug: isFlagOn(params, "debug") || isFlagOn(params, "spike"),
  }
}

export function hasDeepLinkState(state: DeepLinkState): boolean {
  return (
    state.chapterId !== null ||
    state.progress !== null ||
    state.quality !== null ||
    state.debug
  )
}

function findChapter(chapterId: string): HTMLElement | null {
  const sections = document.querySelectorAll<HTMLElement>("[data-chapter]")

  for (const section of sections) {
    if (section.dataset.chapter === chapterId) {
      return section
    }
  }

  return null
}

/**
 * Deja el scroll en el punto que corresponde a `progress` dentro del capítulo.
 * Misma geometría que `scroll.ts`: el trigger empieza con el borde superior en
 * el centro del viewport y termina con el inferior en el centro.
 */
function scrollToChapterProgress(section: HTMLElement, progress: number): void {
  const top = section.getBoundingClientRect().top + window.scrollY
  const height = section.offsetHeight || section.getBoundingClientRect().height
  const target = top - window.innerHeight / 2 + progress * height

  // Ignorar scroll-behavior:smooth para que el enlace sea un estado exacto.
  window.scrollTo({ top: Math.max(0, Math.round(target)), behavior: "instant" })
}

/**
 * Aplica lo que venga en la URL. Devuelve el estado parseado (o `null` si no
 * había nada que aplicar). Es idempotente: se puede llamar en cada page-load.
 */
export function applyDeepLinkState(
  store: ExperienceStore,
  search: string = window.location.search
): DeepLinkState | null {
  if (typeof window === "undefined") return null

  const state = parseDeepLink(search)
  if (!hasDeepLinkState(state)) return null

  if (state.quality) {
    forceQuality(state.quality)
  }

  if (!state.chapterId) {
    return state
  }

  const section = findChapter(state.chapterId)

  if (!section) {
    console.warn(
      `[deep-link] no hay ningún [data-chapter="${state.chapterId}"] en esta página`
    )
    return state
  }

  const progress = state.progress ?? 0
  const chapterId = state.chapterId

  store.setChapter(chapterId)

  // Un frame para que fuentes e imágenes asienten el layout antes de medir.
  // `mountDeepLinks` ya espera dos frames desde el page-load.
  requestAnimationFrame(() => {
    scrollToChapterProgress(section, progress)
    store.setProgress(chapterId, progress)
  })

  return state
}

/**
 * Engancha el deep link al ciclo de View Transitions. Se registra después de
 * `mountChapterScroll`, así los triggers ya existen cuando se mueve el scroll.
 */
export function mountDeepLinks(store: ExperienceStore): () => void {
  let frame = 0
  let cancelled = false

  const run = () => {
    if (cancelled) return

    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (cancelled) return

      frame = requestAnimationFrame(() => {
        applyDeepLinkState(store)
      })
    })
  }

  const onPageLoad = () => run()

  document.addEventListener("astro:page-load", onPageLoad)
  run()

  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
    document.removeEventListener("astro:page-load", onPageLoad)
  }
}
