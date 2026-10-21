import type { ProjectId, SceneDefinition } from "@/experience/types"

/**
 * Registro de escenas (`01-arquitectura.md` §3).
 *
 * Está vacío a propósito: las escenas llegan de T-A14 en adelante. Cada una se
 * registra al final de su propio PR con **una línea** acá (excepción permitida
 * a la regla de archivos calientes, `06-coordinacion.md` §4):
 *
 * ```ts
 * import { vibo } from "./vibo/definition"
 * ```
 *
 * El orden del array es el orden de precarga, no el del recorrido: el recorrido
 * lo define el DOM (`data-chapter`) y ADR-007.
 */
export const scenes: readonly SceneDefinition[] = []

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
