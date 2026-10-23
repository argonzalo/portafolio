/**
 * Catálogo del recorrido (ADR-007 / `00` §3).
 *
 * `id` = valor de `data-chapter` y de `?chapter=` en deep links.
 * Las escenas 3D futuras deben usar el mismo `chapterId` en el registry.
 */

export type JourneyChapter = {
  id: string
  label: string
  /** Etiqueta corta para el índice overlay. */
  indexLabel: string
  group: "apertura" | "primera" | "segunda" | "cierre"
  /** Placeholder hasta que llegue la escena o el copy definitivo. */
  kind: "dom" | "scene" | "vignette" | "archive"
}

export const journeyChapters: JourneyChapter[] = [
  {
    id: "hero",
    label: "Apertura",
    indexLabel: "Inicio",
    group: "apertura",
    kind: "dom",
  },
  {
    id: "manifesto",
    label: "Cómo pienso",
    indexLabel: "Cómo pienso",
    group: "apertura",
    kind: "dom",
  },
  {
    id: "vibo",
    label: "Vibo",
    indexLabel: "Vibo",
    group: "primera",
    kind: "scene",
  },
  {
    id: "pirp",
    label: "Pirp",
    indexLabel: "Pirp",
    group: "primera",
    kind: "scene",
  },
  {
    id: "naturalis",
    label: "Naturalis",
    indexLabel: "Naturalis",
    group: "primera",
    kind: "scene",
  },
  {
    id: "banner-2",
    label: "Banner 2.0",
    indexLabel: "Banner 2.0",
    group: "primera",
    kind: "scene",
  },
  {
    id: "agnt",
    label: "AGNT",
    indexLabel: "AGNT",
    group: "segunda",
    kind: "vignette",
  },
  {
    id: "archive",
    label: "Tercera línea",
    indexLabel: "Tercera línea",
    group: "cierre",
    kind: "archive",
  },
  {
    id: "about",
    label: "Quién soy",
    indexLabel: "Quién soy",
    group: "cierre",
    kind: "dom",
  },
  {
    id: "contact",
    label: "Conversemos",
    indexLabel: "Conversemos",
    group: "cierre",
    kind: "dom",
  },
]

export const journeyChapterGroups: {
  id: JourneyChapter["group"]
  label: string
}[] = [
  { id: "apertura", label: "Apertura" },
  { id: "primera", label: "Primera línea" },
  { id: "segunda", label: "Segunda línea" },
  { id: "cierre", label: "Cierre y archivo" },
]

export function chapterHref(id: string): string {
  return `/#${id}`
}

export function chapterDeepLink(id: string): string {
  return `/?chapter=${encodeURIComponent(id)}`
}
