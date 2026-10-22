import { createContext, type RefObject } from "react"
import { Material, Vector3, type Object3D, type Mesh } from "three"

export type Presentation = {
  opacity: number
  eye: Vector3
  target: Vector3
  ready: boolean
}

export const PresentationContext =
  createContext<RefObject<Presentation> | null>(null)

/** Scene-local reveals compose with the chapter dissolve, never overwrite it. */
export function reveal(object: Object3D | null, opacity: number) {
  if (!object) return
  object.userData.reveal = opacity
  object.visible = opacity > 0.001
}

const originals = new WeakMap<
  Material,
  { opacity: number; transparent: boolean; depthWrite: boolean }
>()

export function composeOpacity(object: Object3D, parentOpacity: number) {
  const alpha = parentOpacity * (object.userData.reveal ?? 1)
  const material = (object as Mesh).material
  if (material) {
    for (const mat of Array.isArray(material) ? material : [material]) {
      let base = originals.get(mat)
      if (!base) {
        base = {
          opacity: mat.opacity,
          transparent: mat.transparent,
          depthWrite: mat.depthWrite,
        }
        originals.set(mat, base)
      }
      const transparent = base.transparent || alpha < 0.999
      if (mat.transparent !== transparent) {
        mat.transparent = transparent
        mat.needsUpdate = true
      }
      mat.opacity = base.opacity * alpha
      mat.depthWrite = base.depthWrite && alpha > 0.999
      // Custom shaders opt into the same dissolve as MeshBasicMaterial/Line2.
      const uniforms = (
        mat as Material & { uniforms?: Record<string, { value: number }> }
      ).uniforms
      if (uniforms?.uOpacity) uniforms.uOpacity.value = mat.opacity
    }
  }
  for (const child of object.children) composeOpacity(child, alpha)
}

export function inheritedReveal(object: Object3D | null) {
  let alpha = 1
  while (object) {
    if (!object.visible) return 0
    alpha *= object.userData.reveal ?? 1
    object = object.parent
  }
  return alpha
}

export function revealHtml(element: HTMLElement | null, opacity: number) {
  if (!element) return
  element.style.opacity = String(opacity)
  element.style.visibility = opacity > 0.001 ? "visible" : "hidden"
  element.style.pointerEvents = opacity > 0.95 ? "auto" : "none"
}

/** Mutable render-loop channel, deliberately separate from React state. */
export function writeCameraPose(
  presentation: Presentation,
  eye: Vector3,
  target: Vector3
) {
  presentation.eye.copy(eye)
  presentation.target.copy(target)
  presentation.ready = true
}
