import type { ProjectId, SceneDefinition } from "@/experience/types"
import { vibo } from "./vibo/definition"
import { pirp } from "./pirp/definition"
import { naturalis } from "./naturalis/definition"
import { banner } from "./banner-2/definition"
import { agnt } from "./agnt/definition"
// Nota: Starbene y Cielo y Mar pasan a tercera línea; se conservan sus archivos en src/scenes/ sin importar aquí.

/**
 * Registro de escenas (`01-arquitectura.md` §3).
 *
 * Escenas activas en el recorrido: primera línea (Vibo, Pirp, Naturalis, Banner 2.0)
 * y segunda línea (AGNT). Starbene y Cielo y Mar pasaron a tercera línea.
 */
export const scenes: readonly SceneDefinition[] = [
  vibo,
  pirp,
  naturalis,
  banner,
  agnt,
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
