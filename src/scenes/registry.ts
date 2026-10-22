import type { ProjectId, SceneDefinition } from "@/experience/types"
import { vibo } from "./vibo/definition"
import { pirp } from "./pirp/definition"
import { naturalis } from "./naturalis/definition"
import { banner } from "./banner-2/definition"

/**
 * Registro de escenas (`01-arquitectura.md` §3).
 *
 * Greyboxes de primera línea de T-A14. Cada definición mantiene su chunk lazy;
 * el registro solo importa metadatos, nunca el componente de la escena.
 *
 * El orden del array es el orden de precarga, no el del recorrido: el recorrido
 * lo define el DOM (`data-chapter`) y ADR-007.
 */
export const scenes: readonly SceneDefinition[] = [
  vibo,
  pirp,
  naturalis,
  banner,
]

const byId = new Map<string, SceneDefinition>(
  scenes.map((scene) => [scene.id, scene])
)

const byChapter = new Map<string, SceneDefinition>(
  scenes.map((scene) => [scene.chapterId, scene])
)

/** Acepta `string` porque las acciones del guía llegan sin tipar. */
export function getScene(id: ProjectId | string): SceneDefinition | undefined {
  return byId.get(id)
}

export function getSceneByChapter(
  chapterId: string
): SceneDefinition | undefined {
  return byChapter.get(chapterId)
}

export function getRegisteredSceneIds(): ProjectId[] {
  return scenes.map((scene) => scene.id)
}
