import { useEffect, useMemo, useState } from "react"
import { useThree } from "@react-three/fiber"
import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type Material,
  type Texture,
  type WebGLRenderer,
} from "three"

import { DEVICE_FINISHES, type DeviceFinish, type RenderTier } from "./specs"

/* -------------------------------------------------------------------------- */
/*  Entorno de estudio procedural (reflejos de producto, sin descargas)        */
/* -------------------------------------------------------------------------- */

type EnvEntry = { texture: Texture; dispose: () => void; refs: number }
const envCache = new WeakMap<WebGLRenderer, EnvEntry>()

/**
 * Estudio fotográfico mínimo: caja oscura + softbox cenital + dos strips
 * laterales + rebote frontal. Se prefiltra una vez con PMREM (HDR) y se
 * comparte entre todos los dispositivos del mismo renderer.
 */
function buildStudioScene(): Scene {
  const scene = new Scene()
  const room = new Mesh(
    new BoxGeometry(20, 20, 20),
    new MeshBasicMaterial({ color: new Color("#0c0d10"), side: BackSide })
  )
  scene.add(room)

  const panel = (
    width: number,
    height: number,
    intensity: number,
    position: [number, number, number],
    lookAt: [number, number, number] = [0, 0, 0],
    tint = "#ffffff"
  ) => {
    const mesh = new Mesh(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({
        color: new Color(tint).multiplyScalar(intensity),
        side: DoubleSide,
      })
    )
    mesh.position.set(...position)
    mesh.lookAt(...lookAt)
    scene.add(mesh)
  }

  panel(9, 6, 2.4, [0, 9.5, 1.5]) // softbox cenital
  panel(1.6, 9, 5.2, [-9.5, 1, 2]) // strip izquierdo (borde brillante)
  panel(1.2, 9, 3.4, [9.5, 1.5, -1.5], [0, 0, 0], "#f2f5ff") // strip derecho frío
  panel(14, 3, 0.55, [0, -1, 9.5]) // rebote frontal suave
  panel(6, 2, 0.9, [0, 3, -9.5], [0, 0, 0], "#fff4e8") // contraluz cálido
  return scene
}

function disposeScene(scene: Scene) {
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      ;(object.material as Material).dispose()
    }
  })
}

function acquireStudioEnv(gl: WebGLRenderer): Texture {
  const cached = envCache.get(gl)
  if (cached) {
    cached.refs += 1
    return cached.texture
  }
  const pmrem = new PMREMGenerator(gl)
  const scene = buildStudioScene()
  const target = pmrem.fromScene(scene, 0.035)
  disposeScene(scene)
  pmrem.dispose()
  envCache.set(gl, { texture: target.texture, dispose: () => target.dispose(), refs: 1 })
  return target.texture
}

function releaseStudioEnv(gl: WebGLRenderer) {
  const cached = envCache.get(gl)
  if (!cached) return
  cached.refs -= 1
  if (cached.refs > 0) return
  // Diferido: permite remontar (StrictMode / cambio de escena) sin regenerar.
  window.setTimeout(() => {
    const current = envCache.get(gl)
    if (current && current.refs <= 0) {
      current.dispose()
      envCache.delete(gl)
    }
  }, 1500)
}

/**
 * Mapa de entorno de estudio compartido. Se aplica por material (`envMap`), no
 * a `scene.environment`, para no alterar la iluminación del resto de la escena.
 */
export function useStudioEnvironment(): Texture | null {
  const gl = useThree((state) => state.gl)
  const [texture, setTexture] = useState<Texture | null>(null)

  useEffect(() => {
    const env = acquireStudioEnv(gl)
    queueMicrotask(() => setTexture(env))
    return () => {
      setTexture(null)
      releaseStudioEnv(gl)
    }
  }, [gl])

  return texture
}

/* -------------------------------------------------------------------------- */
/*  Materiales por acabado                                                     */
/* -------------------------------------------------------------------------- */

export type DeviceMaterials = {
  /** Aluminio / titanio anodizado del cuerpo. */
  body: MeshStandardMaterial
  /** Variante satinada (trackpad, plataforma de cámaras). */
  bodySatin: MeshStandardMaterial
  /** Panel trasero esmerilado. */
  back: MeshStandardMaterial
  /** Vidrio negro pulido (frente, biseles). */
  glassBlack: MeshStandardMaterial
  /** Teclas, bisagras, juntas. */
  trim: MeshStandardMaterial
  /** Cristal de lente. */
  lens: MeshStandardMaterial
  /** Negro absoluto (isla, notch, rejillas). */
  void: MeshBasicMaterial
}

export type DeviceMaterialOptions = {
  finish: DeviceFinish
  tier: RenderTier
  envMap: Texture | null
  envIntensity?: number
}

export function useDeviceMaterials({
  finish,
  tier,
  envMap,
  envIntensity = 1,
}: DeviceMaterialOptions): DeviceMaterials {
  const materials = useMemo<DeviceMaterials>(() => {
    const spec = DEVICE_FINISHES[finish]
    const metalBoost = tier === "low" ? 0.06 : 0
    return {
      body: new MeshStandardMaterial({
        color: spec.body,
        metalness: 1,
        roughness: spec.bodyRoughness + metalBoost,
      }),
      bodySatin: new MeshStandardMaterial({
        color: spec.body,
        metalness: 0.85,
        roughness: 0.24,
      }),
      back: new MeshStandardMaterial({
        color: spec.back,
        metalness: 0.35,
        roughness: spec.backRoughness,
      }),
      glassBlack: new MeshStandardMaterial({
        color: "#050506",
        metalness: 0,
        roughness: 0.06,
      }),
      trim: new MeshStandardMaterial({
        color: spec.trim,
        metalness: 0.1,
        roughness: 0.58,
      }),
      lens: new MeshStandardMaterial({
        color: "#07090d",
        metalness: 0.3,
        roughness: 0.03,
      }),
      void: new MeshBasicMaterial({ color: "#010101" }),
    }
  }, [finish, tier])

  useEffect(() => {
    for (const material of Object.values(materials)) {
      if (material instanceof MeshStandardMaterial) {
        material.envMap = envMap
        // Sin entorno, los metales se verían negros: compensar con emisivo tenue.
        material.envMapIntensity = envIntensity
        material.emissive.set(envMap ? "#000000" : material.color).multiplyScalar(envMap ? 0 : 0.18)
        material.needsUpdate = true
      }
    }
  }, [materials, envMap, envIntensity])

  useEffect(
    () => () => {
      for (const material of Object.values(materials)) material.dispose()
    },
    [materials]
  )

  return materials
}
