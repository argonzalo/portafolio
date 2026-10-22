import { Color, Vector3, type ShaderMaterial } from "three"
import type { ThreadForm } from "../types"
import { THREAD_STYLES } from "./path"
import { HANDOFF_START } from "@/experience/choreography"

export const PATH_SAMPLES = 32
/** Shared with camera, chapter reveals and palette. */
export const THREAD_HANDOFF_START = HANDOFF_START

export type ThreadFrame = {
  points: Vector3[]
  color: Color
  head: Color
  /** 0 en capítulos oscuros; 1 en capítulos claros (Naturalis) para reforzar contraste. */
  lightMix: number
}

export type ChapterThreadProfile = {
  /** Mezcla del shader: 0 = cometa concentrado (Vibo), 1 = señal multi-pulso (Pirp). */
  mix: number
  /** Velocidad relativa de pulsos y flujo dentro del capítulo. */
  speed: number
  /** Color de la cabeza/punta del hilo. */
  head: string
  /** Color de línea para el hilo cuando difiere de `form.color` (p.ej. azul eléctrico en Vibo o salvia profundo en Naturalis). */
  lineColor?: string
  /** Esquema luminoso del capítulo. */
  scheme: "dark" | "light"
}

export const CHAPTER_SEQUENCE = [
  "hero",
  "manifesto",
  "vibo",
  "pirp",
  "naturalis",
  "banner-2",
  "starbene",
  "agnt",
  "cielo-y-mar",
  "archive",
  "about",
  "contact",
] as const

export function nextJourneyChapter(chapterId: string): string | null {
  const index = CHAPTER_SEQUENCE.indexOf(
    chapterId as (typeof CHAPTER_SEQUENCE)[number]
  )
  if (index < 0 || index >= CHAPTER_SEQUENCE.length - 1) {
    return null
  }
  return CHAPTER_SEQUENCE[index + 1] ?? null
}

export function chapterIndexOf(chapterId: string): number {
  const index = CHAPTER_SEQUENCE.indexOf(
    chapterId as (typeof CHAPTER_SEQUENCE)[number]
  )
  return index >= 0 ? index : 0
}

export function createThreadFrame(): ThreadFrame {
  return {
    points: Array.from({ length: PATH_SAMPLES }, () => new Vector3()),
    color: new Color(),
    head: new Color("#EFE9DD"),
    lightMix: 0,
  }
}

const line: ThreadForm = { shape: "line", color: "#91baff" }
export const chapterForms: Readonly<Record<string, ThreadForm>> = {
  hero: line,
  manifesto: { shape: "branching", color: "#91baff" },
  vibo: { shape: "trajectory", color: THREAD_STYLES.vibo.line },
  pirp: { shape: "branching", color: THREAD_STYLES.pirp.line },
  naturalis: { shape: "growth", color: "#56857D" },
  "banner-2": { shape: "split", color: "#DA3E00" },
  starbene: { shape: "growth", color: "#7cc6b8" },
  agnt: { shape: "branching", color: "#6ea8fe" },
  "cielo-y-mar": { shape: "line", color: "#eab676" },
  archive: line,
  about: { shape: "growth", color: "#d8b48a" },
  contact: line,
}

const DEFAULT_PROFILE: ChapterThreadProfile = {
  mix: 0.2,
  speed: 0.8,
  head: "#EFE9DD",
  scheme: "dark",
}

export const CHAPTER_THREAD_PROFILES: Readonly<
  Record<string, ChapterThreadProfile>
> = {
  hero: {
    mix: 0.12,
    speed: 0.72,
    head: "#EFE9DD",
    lineColor: "#91baff",
    scheme: "dark",
  },
  manifesto: {
    mix: 0.32,
    speed: 0.88,
    head: "#f5d78e",
    lineColor: "#6d9eff",
    scheme: "dark",
  },
  vibo: {
    mix: 0.0,
    speed: 1.0,
    head: "#f5c451",
    lineColor: "#3d8bff",
    scheme: "dark",
  },
  pirp: {
    mix: 1.0,
    speed: 1.65,
    head: "#EFE9DD",
    lineColor: "#7A1F2B",
    scheme: "dark",
  },
  naturalis: {
    mix: 0.22,
    speed: 0.58,
    head: "#26463F",
    lineColor: "#3E6E65",
    scheme: "light",
  },
  "banner-2": {
    mix: 0.82,
    speed: 1.38,
    head: "#FFF0E9",
    lineColor: "#DA3E00",
    scheme: "dark",
  },
  starbene: {
    mix: 0.35,
    speed: 0.88,
    head: "#EFE9DD",
    lineColor: "#7cc6b8",
    scheme: "dark",
  },
  agnt: {
    mix: 0.65,
    speed: 1.15,
    head: "#EFE9DD",
    lineColor: "#6ea8fe",
    scheme: "dark",
  },
  "cielo-y-mar": {
    mix: 0.18,
    speed: 0.7,
    head: "#FFF0E9",
    lineColor: "#eab676",
    scheme: "dark",
  },
  archive: DEFAULT_PROFILE,
  about: {
    mix: 0.2,
    speed: 0.75,
    head: "#EFE9DD",
    lineColor: "#d8b48a",
    scheme: "dark",
  },
  contact: DEFAULT_PROFILE,
}

export function chapterThreadProfile(chapter: string): ChapterThreadProfile {
  return CHAPTER_THREAD_PROFILES[chapter] ?? DEFAULT_PROFILE
}

export function fallbackForm(chapter: string): ThreadForm {
  return chapterForms[chapter] ?? line
}

function catmullRomScalar(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t
  const t3 = t2 * t
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  )
}

/** Anchors are world coordinates; absent anchors use normalized presets. */
export function sampleForm(
  form: ThreadForm,
  progress: number,
  x: number,
  y: number,
  output: Vector3[]
): void {
  const anchors = form
    .anchors?.(progress)
    ?.filter((point) => point.length === 3 && point.every(Number.isFinite))
  for (let i = 0; i < output.length; i++) {
    const u = i / (output.length - 1)
    if (anchors?.length) {
      if (anchors.length === 1) {
        output[i].set(anchors[0][0], anchors[0][1], anchors[0][2])
        continue
      }
      const index = u * (anchors.length - 1)
      const seg = Math.min(anchors.length - 2, Math.floor(index))
      const t = index - seg
      if (anchors.length === 2) {
        const a = anchors[0]
        const b = anchors[1]
        output[i].set(
          a[0] + (b[0] - a[0]) * u,
          a[1] + (b[1] - a[1]) * u,
          a[2] + (b[2] - a[2]) * u
        )
        continue
      }
      const p0 = anchors[Math.max(0, seg - 1)]
      const p1 = anchors[seg]
      const p2 = anchors[Math.min(anchors.length - 1, seg + 1)]
      const p3 = anchors[Math.min(anchors.length - 1, seg + 2)]
      output[i].set(
        catmullRomScalar(p0[0], p1[0], p2[0], p3[0], t),
        catmullRomScalar(p0[1], p1[1], p2[1], p3[1], t),
        catmullRomScalar(p0[2], p1[2], p2[2], p3[2], t)
      )
      continue
    }
    let height = 0
    switch (form.shape) {
      case "trajectory":
        height =
          u < 0.64
            ? -14.27 * (u - 0.3) ** 2 + 0.85
            : -0.8 + 0.55 * (1 - ((u - 0.82) / 0.18) ** 2)
        break
      case "branching":
        height = Math.sin(u * Math.PI * 6) * Math.sin(u * Math.PI) * 0.55
        break
      case "growth":
        height = Math.sin(u * Math.PI * 2) * 0.65
        break
      case "split":
        height = Math.sin(u * Math.PI * 4) * 0.45
        break
    }
    output[i].set((u * 2 - 1) * x, height * y, 0)
  }
}

export function pathUniforms() {
  return {
    uUsePath: { value: 0 },
    uPath: { value: createThreadFrame().points },
    uLightScheme: { value: 0 },
  }
}

export function applyThreadFrame(
  material: ShaderMaterial,
  frame?: ThreadFrame
) {
  material.uniforms.uUsePath.value = frame ? 1 : 0
  if (material.uniforms.uLightScheme) {
    material.uniforms.uLightScheme.value = frame ? frame.lightMix : 0
  }
  if (!frame) return
  material.uniforms.uPath.value = frame.points
  for (const name of ["uLineA", "uLineB"])
    material.uniforms[name]?.value.copy(frame.color)
  for (const name of ["uHeadA", "uHeadB"])
    material.uniforms[name]?.value.copy(frame.head)
}
