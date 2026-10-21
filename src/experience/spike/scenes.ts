import type { ComponentType } from "react"

import type { ProjectId, SceneProps } from "@/experience/types"

/**
 * Escenas de prueba del spike T-A06.
 * Viven en `experience/` (no en `scenes/`) para no tocar el registry caliente.
 * Se reemplazan cuando lleguen las escenas reales (T-A14+).
 */
export type SpikeSceneEntry = {
  chapterId: string
  /** Solo para tipar señales / beats; no implica contenido de producto. */
  sceneId: ProjectId
  label: string
  accent: string
  load: () => Promise<{ default: ComponentType<SceneProps> }>
}

export const SPIKE_SCENES: readonly SpikeSceneEntry[] = [
  {
    chapterId: "spike-alpha",
    sceneId: "vibo",
    label: "Dummy A · icosaedro",
    accent: "#7dd3fc",
    load: () => import("./DummyAlpha"),
  },
  {
    chapterId: "spike-beta",
    sceneId: "pirp",
    label: "Dummy B · toro",
    accent: "#fbbf24",
    load: () => import("./DummyBeta"),
  },
] as const

const byChapter = new Map(
  SPIKE_SCENES.map((scene) => [scene.chapterId, scene])
)

export function getSpikeScene(
  chapterId: string
): SpikeSceneEntry | undefined {
  return byChapter.get(chapterId)
}

export function isSpikeChapter(chapterId: string | null): boolean {
  return chapterId !== null && byChapter.has(chapterId)
}
