import type { Material, Object3D, Texture } from "three"

/**
 * Libera geometrías, materiales y texturas de un subárbol.
 * Las escenas deben llamar esto al desmontar (G0 / sin fugas).
 */
export function disposeObject3D(root: Object3D): void {
  root.traverse((node) => {
    const mesh = node as Object3D & {
      geometry?: { dispose: () => void }
      material?: Material | Material[]
    }

    mesh.geometry?.dispose()

    const material = mesh.material
    if (!material) return

    if (Array.isArray(material)) {
      for (const entry of material) {
        disposeMaterial(entry)
      }
      return
    }

    disposeMaterial(material)
  })
}

function disposeMaterial(material: Material): void {
  const record = material as Material & Record<string, unknown>

  for (const value of Object.values(record)) {
    if (isTexture(value)) {
      value.dispose()
    }
  }

  material.dispose()
}

function isTexture(value: unknown): value is Texture {
  return (
    typeof value === "object" &&
    value !== null &&
    "isTexture" in value &&
    (value as Texture).isTexture === true
  )
}
