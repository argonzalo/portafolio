import { Color, Vector3, type ShaderMaterial } from "three"
import type { ThreadForm } from "../types"
import { THREAD_STYLES } from "./path"

export const PATH_SAMPLES = 32
export type ThreadFrame = {
  points: Vector3[]
  color: Color
  head: Color
}

export function createThreadFrame(): ThreadFrame {
  return {
    points: Array.from({ length: PATH_SAMPLES }, () => new Vector3()),
    color: new Color(),
    head: new Color("#EFE9DD"),
  }
}

const line: ThreadForm = { shape: "line", color: "#91baff" }
export const chapterForms: Readonly<Record<string, ThreadForm>> = {
  hero: line,
  manifesto: { shape: "branching", color: "#91baff" },
  vibo: { shape: "trajectory", color: THREAD_STYLES.vibo.line },
  pirp: { shape: "branching", color: THREAD_STYLES.pirp.line },
  naturalis: { shape: "growth", color: "#72916b" },
  "banner-2": { shape: "split", color: "#57c7e3" },
}

export function fallbackForm(chapter: string): ThreadForm {
  return chapterForms[chapter] ?? line
}

/** Anchors are world coordinates at z=0; absent anchors use normalized presets. */
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
      const index = u * (anchors.length - 1)
      const a = anchors[Math.floor(index)]
      const b = anchors[Math.min(anchors.length - 1, Math.floor(index) + 1)]
      const t = index % 1
      output[i].set(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
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
  }
}

export function applyThreadFrame(
  material: ShaderMaterial,
  frame?: ThreadFrame
) {
  material.uniforms.uUsePath.value = frame ? 1 : 0
  if (!frame) return
  material.uniforms.uPath.value = frame.points
  for (const name of ["uLineA", "uLineB"])
    material.uniforms[name]?.value.copy(frame.color)
  for (const name of ["uHeadA", "uHeadB"])
    material.uniforms[name]?.value.copy(frame.head)
}
