import { useMemo, type ReactNode } from "react"
import type { ThreeElements } from "@react-three/fiber"
import { CapsuleGeometry, CircleGeometry, CylinderGeometry, type BufferGeometry } from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

import type { QualityTier } from "@/experience/types"

import { DeviceScreen, type DeviceScreenContent } from "./DeviceScreen"
import { createRoundedPlaneGeometry, createRoundedSlabGeometry } from "./geometry"
import { useDeviceTier, useDisposable } from "./hooks"
import { useDeviceMaterials, useStudioEnvironment } from "./materials"
import { PHONE_SCREEN, PHONE_SPEC, type DeviceFinish } from "./specs"

export type DeviceBaseProps = Omit<ThreeElements["group"], "children"> & {
  /** Nivel de calidad. Por defecto, el del store de experiencia. */
  quality?: QualityTier
  finish?: DeviceFinish
  /** Contenido de la pantalla: captura/video/textura, encendido y capas flotantes. */
  screen?: DeviceScreenContent
  /** Intensidad de los reflejos de estudio sobre el cuerpo. Por defecto `1`. */
  envIntensity?: number
  /** Hijos anclados al sistema local del dispositivo (HUD, etiquetas, etc.). */
  children?: ReactNode
}

export type PhoneProps = DeviceBaseProps & {
  /** Relación ancho/alto de la captura. Ajusta la altura sin deformar marcos ni esquinas. */
  screenAspect?: number
  /** Isla de cámara frontal. Por defecto `true`. */
  island?: boolean
  /** Detalle trasero (módulo de cámaras). Desactivar si nunca se ve el dorso. */
  back?: boolean
}

const S = PHONE_SPEC

/** Lentes del módulo trasero en coordenadas del módulo (vista desde el dorso). */
const LENS_OFFSETS: readonly [number, number][] = [
  [0.076, 0.076],
  [0.076, -0.076],
  [-0.076, 0],
]

/**
 * Teléfono de 6,1" con marco metálico, frente de vidrio negro, isla dinámica,
 * botones laterales y módulo de cámaras. Origen en el centro del equipo; la
 * pantalla mira a +Z. Medidas reales en unidades del kit (1 = 10 cm).
 */
export function Phone({
  quality,
  finish = "space-black",
  screen,
  envIntensity = 1,
  island = true,
  back = true,
  screenAspect,
  children,
  ...group
}: PhoneProps) {
  const tier = useDeviceTier(quality)
  const envMap = useStudioEnvironment()
  const materials = useDeviceMaterials({ finish, tier, envMap, envIntensity })
  const screenHeight = screenAspect && Number.isFinite(screenAspect) && screenAspect > 0
    ? PHONE_SCREEN.width / screenAspect
    : PHONE_SCREEN.height
  const height = screenHeight + (S.height - PHONE_SCREEN.height)

  const bodyGeometry = useDisposable(
    useMemo(
      () => createRoundedSlabGeometry(S.width, height, S.depth, S.radius, S.bevel, tier),
      [tier, height]
    )
  )
  const faceGeometry = useDisposable(
    useMemo(
      () =>
        createRoundedPlaneGeometry(
          S.width - S.bevel * 2,
          height - S.bevel * 2,
          S.radius - S.bevel,
          tier
        ),
      [tier, height]
    )
  )
  const islandGeometry = useDisposable(
    useMemo(
      () => createRoundedPlaneGeometry(S.island.width, S.island.height, S.island.height / 2, tier),
      [tier]
    )
  )
  const buttonsGeometry = useDisposable(
    useMemo(() => {
      const button = (x: number, y: number, length: number) => {
        const geometry = new CapsuleGeometry(0.0085, length, 3, 8)
        geometry.scale(0.7, 1, 1.15)
        geometry.translate(x, y, 0)
        return geometry
      }
      const edge = S.width / 2 + 0.001
      const offset = (height - S.height) / 2
      const parts = [
        button(-edge, 0.5 + offset, 0.05), // botón de acción
        button(-edge, 0.35 + offset, 0.1), // volumen +
        button(-edge, 0.21 + offset, 0.1), // volumen −
        button(edge, 0.3 + offset, 0.16), // encendido
      ]
      const merged = mergeGeometries(parts, false) as BufferGeometry
      for (const part of parts) part.dispose()
      return merged
    }, [height])
  )

  const cam = S.cameraModule
  const moduleGeometry = useDisposable(
    useMemo(
      () => createRoundedSlabGeometry(cam.size, cam.size, cam.height, cam.radius, 0.004, tier),
      [cam.size, cam.height, cam.radius, tier]
    )
  )
  const lensRingGeometry = useDisposable(
    useMemo(() => {
      const segments = tier === "high" ? 40 : 24
      const parts = LENS_OFFSETS.map(([x, y]) => {
        const ring = new CylinderGeometry(0.064, 0.066, 0.017, segments)
        ring.rotateX(Math.PI / 2)
        ring.translate(x, y, -0.0085)
        return ring
      })
      const merged = mergeGeometries(parts, false) as BufferGeometry
      for (const part of parts) part.dispose()
      return merged
    }, [tier])
  )
  const lensGlassGeometry = useDisposable(
    useMemo(() => {
      const segments = tier === "high" ? 40 : 24
      const parts = LENS_OFFSETS.map(([x, y]) => {
        const disc = new CircleGeometry(0.05, segments)
        disc.rotateY(Math.PI)
        disc.translate(x, y, -0.0172)
        return disc
      })
      const flash = new CircleGeometry(0.018, 16)
      flash.rotateY(Math.PI)
      flash.translate(-0.076, 0.11, -0.0005)
      parts.push(flash)
      const merged = mergeGeometries(parts, false) as BufferGeometry
      for (const part of parts) part.dispose()
      return merged
    }, [tier])
  )

  const zFront = S.depth / 2
  const screenTop = screenHeight / 2
  const moduleX = S.width / 2 - cam.inset - cam.size / 2
  const moduleY = height / 2 - cam.inset - cam.size / 2

  return (
    <group {...group}>
      <mesh geometry={bodyGeometry} material={materials.body} />
      <mesh geometry={faceGeometry} material={materials.glassBlack} position-z={zFront + 0.0004} />

      <group position-z={zFront + 0.0008}>
        <DeviceScreen
          {...screen}
          width={PHONE_SCREEN.width}
          height={screenHeight}
          radius={S.screenRadius}
          tier={tier}
          envMap={envMap}
          align={screen?.align ?? "top"}
        />
      </group>

      {island ? (
        <mesh
          geometry={islandGeometry}
          material={materials.void}
          position={[0, screenTop - S.island.top - S.island.height / 2, zFront + 0.0022]}
          renderOrder={7}
        />
      ) : null}

      <mesh geometry={buttonsGeometry} material={materials.body} />

      {back ? (
        <>
          <mesh
            geometry={faceGeometry}
            material={materials.back}
            position-z={-zFront - 0.0004}
            rotation-y={Math.PI}
          />
          <group position={[moduleX, moduleY, -zFront - cam.height / 2 - 0.0004]}>
            <mesh geometry={moduleGeometry} material={materials.back} />
            <group position-z={-cam.height / 2}>
              <mesh geometry={lensRingGeometry} material={materials.body} />
              <mesh geometry={lensGlassGeometry} material={materials.lens} />
            </group>
          </group>
        </>
      ) : null}

      {children}
    </group>
  )
}
