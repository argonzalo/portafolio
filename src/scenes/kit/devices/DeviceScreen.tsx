import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  type Texture,
} from "three"

import { experienceStore } from "@/experience/store"

import { createRoundedPlaneGeometry } from "./geometry"
import { useDisposable } from "./hooks"
import { getSoftMaskTexture, SOFT_MASK_SPREAD } from "./softMask"
import { resolveScalar, type DynamicScalar, type RenderTier } from "./specs"
import {
  computeFitTransform,
  getTextureAspect,
  layoutLayerRect,
  useScreenTexture,
  type ScreenAlign,
  type ScreenFit,
  type UvTransform,
} from "./screenTexture"

/* -------------------------------------------------------------------------- */
/*  API pública                                                                */
/* -------------------------------------------------------------------------- */

export type DeviceLayer = {
  id: string
  /**
   * Región de la captura de pantalla `[x, y, ancho, alto]`, normalizada `0..1`
   * con origen arriba-izquierda (como se mide sobre la imagen). La capa nace
   * exactamente sobre esa región y se despega hacia el espectador.
   */
  rect: readonly [number, number, number, number]
  /** Distancia sobre la pantalla con separación completa (unidades del kit: 1 = 10 cm). */
  depth: number
  /** Imagen propia (PNG con UI aislada, etc.). Sin `src`/`texture`, recorta la captura. */
  src?: string
  texture?: Texture | null
  /** Radio de esquina en unidades del kit. Por defecto, proporcional al tamaño. */
  radius?: number
  /** Escala con separación completa. Por defecto `1.04`. */
  scale?: number
  /** Halo de acento (color CSS). Recomendado solo en temas oscuros. */
  accent?: string
  /** Escalonado `0..1`: la capa empieza a despegarse cuando `separation > delay`. */
  delay?: number
}

export type DeviceScreenContent = {
  /** Captura (`.webp`/`.png`/`.jpg`) o video (`.mp4`/`.webm`, muteado y en loop). */
  src?: string
  /** Textura propia (p. ej. `CanvasTexture` con UI generada). Tiene prioridad sobre `src`. */
  texture?: Texture | null
  fit?: ScreenFit
  /** Qué franja conservar si la captura no tiene la proporción de la pantalla. */
  align?: ScreenAlign
  /** `0` apagada → `1` encendida. Animable sin re-render. */
  power?: DynamicScalar
  /** Multiplicador de brillo de la pantalla (no tone-mapped). Por defecto `1`. */
  brightness?: number
  /** Capas de UI que se separan y flotan sobre la pantalla. */
  layers?: readonly DeviceLayer[]
  /** `0` capas pegadas a la pantalla → `1` separación completa. Animable. */
  separation?: DynamicScalar
  /** Reflejo del vidrio frontal (se omite en calidad `low`). Por defecto `true`. */
  glare?: boolean
}

/* -------------------------------------------------------------------------- */
/*  Recursos compartidos                                                       */
/* -------------------------------------------------------------------------- */

const OFF_COLOR = new Color("#050608")
const Z_GLASS = 0.0012
const Z_HOLE = 0.0016
const Z_SHADOW = 0.002
const Z_LAYER = 0.0028

const SHADOW_SPREAD = SOFT_MASK_SPREAD

function cloneWithTransform(source: Texture, transform: UvTransform): Texture {
  // Los clones comparten `source`: three reutiliza la misma textura de GPU.
  const texture = source.clone()
  texture.repeat.set(transform.repeat[0], transform.repeat[1])
  texture.offset.set(transform.offset[0], transform.offset[1])
  texture.needsUpdate = true
  return texture
}

/* -------------------------------------------------------------------------- */
/*  Pantalla                                                                   */
/* -------------------------------------------------------------------------- */

type DeviceScreenProps = DeviceScreenContent & {
  width: number
  height: number
  radius: number
  tier: RenderTier
  envMap: Texture | null
}

/**
 * Pantalla texturizable + vidrio + capas flotantes. Se ubica en el plano XY
 * local con la cara visible hacia +Z.
 */
export function DeviceScreen({
  width,
  height,
  radius,
  tier,
  envMap,
  src,
  texture,
  fit = "cover",
  align = "center",
  power = 1,
  brightness = 1,
  layers,
  separation = 0,
  glare = true,
}: DeviceScreenProps) {
  const loaded = useScreenTexture(texture ? undefined : src)
  const source = texture ?? loaded

  const geometry = useDisposable(
    useMemo(
      () => createRoundedPlaneGeometry(width, height, radius, tier),
      [width, height, radius, tier]
    )
  )

  const transform = useMemo<UvTransform | null>(
    () =>
      source
        ? computeFitTransform(getTextureAspect(source), width / height, fit, align)
        : null,
    [source, width, height, fit, align]
  )

  const map = useMemo(
    () => (source && transform ? cloneWithTransform(source, transform) : null),
    [source, transform]
  )
  useEffect(() => () => map?.dispose(), [map])

  const screenMaterial = useDisposable(
    useMemo(
      () => new MeshBasicMaterial({ map, color: OFF_COLOR, toneMapped: false }),
      [map]
    )
  )

  const glassMaterial = useDisposable(
    useMemo(
      () =>
        new MeshStandardMaterial({
          color: "#000000",
          metalness: 0,
          roughness: 0.08,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          envMapIntensity: 0.85,
        }),
      []
    )
  )
  useEffect(() => {
    for (const material of [glassMaterial]) {
      material.envMap = envMap
      material.needsUpdate = true
    }
  }, [glassMaterial, envMap])

  const lightLevel = useRef(0)

  useFrame(() => {
    const level = MathUtils.clamp(resolveScalar(power, 1), 0, 1) * brightness
    lightLevel.current = level
    if (map) screenMaterial.color.setScalar(level)
    else screenMaterial.color.copy(OFF_COLOR)
  })

  const showGlass = glare && tier !== "low" && envMap !== null

  return (
    <group>
      <mesh geometry={geometry} material={screenMaterial} renderOrder={1} />
      {showGlass ? (
        <mesh
          geometry={geometry}
          material={glassMaterial}
          position-z={Z_GLASS}
          renderOrder={4}
        />
      ) : null}
      {source && transform && layers?.length
        ? layers.map((layer, index) => (
            <FloatingLayer
              key={layer.id}
              layer={layer}
              index={index}
              screenSource={source}
              screenTransform={transform}
              screenWidth={width}
              screenHeight={height}
              separation={separation}
              lightLevel={lightLevel}
              tier={tier}
            />
          ))
        : null}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*  Capa flotante                                                              */
/* -------------------------------------------------------------------------- */

type FloatingLayerProps = {
  layer: DeviceLayer
  index: number
  screenSource: Texture
  screenTransform: UvTransform
  screenWidth: number
  screenHeight: number
  separation: DynamicScalar
  lightLevel: { readonly current: number }
  tier: RenderTier
}

function FloatingLayer({
  layer,
  index,
  screenSource,
  screenTransform,
  screenWidth,
  screenHeight,
  separation,
  lightLevel,
  tier,
}: FloatingLayerProps) {
  const ownLoaded = useScreenTexture(layer.texture ? undefined : layer.src)
  const ownSource = layer.texture ?? ownLoaded
  const cropsScreen = !layer.src && !layer.texture

  const layout = useMemo(
    () => layoutLayerRect(layer.rect, screenTransform, screenWidth, screenHeight),
    [layer.rect, screenTransform, screenWidth, screenHeight]
  )

  const map = useMemo(() => {
    if (cropsScreen) {
      const [x, y, w, h] = layer.rect
      const [rx, ry] = screenTransform.repeat
      const [ox, oy] = screenTransform.offset
      return cloneWithTransform(screenSource, {
        repeat: [w * rx, h * ry],
        offset: [ox + x * rx, oy + (1 - y - h) * ry],
      })
    }
    if (!ownSource) return null
    return cloneWithTransform(
      ownSource,
      computeFitTransform(
        getTextureAspect(ownSource),
        layout.width / layout.height,
        "cover",
        "center"
      )
    )
  }, [cropsScreen, layer.rect, screenSource, screenTransform, ownSource, layout.width, layout.height])
  useEffect(() => () => map?.dispose(), [map])

  const radius = layer.radius ?? Math.min(layout.width, layout.height) * 0.09

  const geometry = useDisposable(
    useMemo(
      () => createRoundedPlaneGeometry(layout.width, layout.height, radius, tier),
      [layout.width, layout.height, radius, tier]
    )
  )
  const holeGeometry = useDisposable(
    useMemo(() => new PlaneGeometry(layout.width, layout.height), [layout.width, layout.height])
  )
  const spreadGeometry = useDisposable(
    useMemo(
      () => new PlaneGeometry(layout.width * SHADOW_SPREAD, layout.height * SHADOW_SPREAD),
      [layout.width, layout.height]
    )
  )

  const layerMaterial = useDisposable(
    useMemo(() => new MeshBasicMaterial({ map, toneMapped: false }), [map])
  )
  const holeMaterial = useDisposable(
    useMemo(
      () =>
        new MeshBasicMaterial({
          color: "#000000",
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      []
    )
  )
  const shadowMaterial = useDisposable(
    useMemo(
      () =>
        new MeshBasicMaterial({
          color: "#000000",
          alphaMap: getSoftMaskTexture(),
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      []
    )
  )
  const haloMaterial = useDisposable(
    useMemo(
      () =>
        new MeshBasicMaterial({
          color: layer.accent ?? "#ffffff",
          map: getSoftMaskTexture(),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: AdditiveBlending,
          toneMapped: false,
        }),
      [layer.accent]
    )
  )

  const groupRef = useRef<Group>(null)
  const layerRef = useRef<Mesh>(null)
  const shadowRef = useRef<Mesh>(null)
  const holeRef = useRef<Mesh>(null)
  const haloRef = useRef<Mesh>(null)

  const delay = MathUtils.clamp(layer.delay ?? 0, 0, 0.95)
  const fullScale = layer.scale ?? 1.04
  const richTier = tier !== "low"
  // Bolsa local: el linter de inmutabilidad permite mutar props de materiales three vía Object.values.
  const layerMats = {
    layer: layerMaterial,
    hole: holeMaterial,
    shadow: shadowMaterial,
    halo: haloMaterial,
  }

  useFrame((state) => {
    const group = groupRef.current
    const mesh = layerRef.current
    if (!group || !mesh) return

    const raw = MathUtils.clamp(resolveScalar(separation, 0), 0, 1)
    const local = MathUtils.smootherstep((raw - delay) / (1 - delay), 0, 1)
    const visible = local > 0.001
    group.visible = visible
    if (!visible) return

    const reduced = experienceStore.getSnapshot().reducedMotion
    const t = reduced ? 0 : state.clock.elapsedTime
    const phaseOffset = index * 1.7
    const sway = layer.depth * 0.05 * local

    mesh.position.set(
      0,
      Math.sin(t * 0.9 + phaseOffset) * sway,
      Z_LAYER + layer.depth * local
    )
    mesh.rotation.set(
      Math.sin(t * 0.55 + phaseOffset) * 0.035 * local,
      Math.cos(t * 0.45 + phaseOffset) * 0.045 * local,
      0
    )
    mesh.scale.setScalar(1 + (fullScale - 1) * local)

    for (const material of Object.values(layerMats)) {
      if (material === layerMats.layer) material.color.setScalar(lightLevel.current)
      if (material === layerMats.hole && holeRef.current) material.opacity = 0.42 * local
      if (material === layerMats.shadow && shadowRef.current) {
        material.opacity = 0.5 * local
      }
      if (material === layerMats.halo && haloRef.current) {
        material.opacity = 0.75 * local
      }
    }

    if (shadowRef.current) {
      shadowRef.current.position.set(
        layer.depth * 0.08 * local,
        -layer.depth * 0.22 * local,
        Z_SHADOW
      )
      shadowRef.current.scale.setScalar(1 + 0.18 * local)
    }

    if (haloRef.current) {
      haloRef.current.position.copy(mesh.position)
      haloRef.current.position.z -= 0.0008
      haloRef.current.rotation.copy(mesh.rotation)
      haloRef.current.scale.copy(mesh.scale)
    }
  })

  if (!map) return null

  return (
    <group ref={groupRef} position={[layout.x, layout.y, 0]} visible={false}>
      {richTier && cropsScreen ? (
        <mesh
          ref={holeRef}
          geometry={holeGeometry}
          material={holeMaterial}
          position-z={Z_HOLE}
          renderOrder={2}
        />
      ) : null}
      {richTier ? (
        <mesh
          ref={shadowRef}
          geometry={spreadGeometry}
          material={shadowMaterial}
          renderOrder={3}
        />
      ) : null}
      {richTier && layer.accent ? (
        <mesh
          ref={haloRef}
          geometry={spreadGeometry}
          material={haloMaterial}
          renderOrder={5}
        />
      ) : null}
      <mesh ref={layerRef} geometry={geometry} material={layerMaterial} renderOrder={6} />
    </group>
  )
}
