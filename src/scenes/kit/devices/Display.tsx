import { useMemo } from "react"

import { DeviceScreen } from "./DeviceScreen"
import { createRoundedPlaneGeometry, createRoundedSlabGeometry } from "./geometry"
import { useDeviceTier, useDisposable } from "./hooks"
import { useDeviceMaterials, useStudioEnvironment } from "./materials"
import type { DeviceBaseProps } from "./Phone"
import { DISPLAY_SPEC, getDisplayScreenSize } from "./specs"

export type DisplayProps = DeviceBaseProps & {
  /**
   * - `monitor`: monitor de estudio de 27" en aluminio (respeta `finish`).
   * - `signage`: panel de cartelería digital negro, bisel mínimo (Banner).
   */
  variant?: "monitor" | "signage"
  /** Solo `signage`: orientación del panel. */
  orientation?: "landscape" | "portrait"
  /**
   * `studio`: pie inclinado de aluminio (origen en la mesa, `y = 0`).
   * `none`: panel suelto (origen en el centro del panel).
   * Por defecto `studio` en `monitor` y `none` en `signage`.
   */
  stand?: "studio" | "none"
}

const S = DISPLAY_SPEC

/**
 * Monitor de 27" o panel de cartelería con pantalla texturizable. Proporción
 * 16:9 real, bisel fino, vidrio frontal y pie de aluminio opcional.
 */
export function Display({
  quality,
  finish = "silver",
  screen,
  envIntensity = 1,
  variant = "monitor",
  orientation = "landscape",
  stand,
  children,
  ...group
}: DisplayProps) {
  const tier = useDeviceTier(quality)
  const envMap = useStudioEnvironment()
  const materials = useDeviceMaterials({ finish, tier, envMap, envIntensity })

  const signage = variant === "signage"
  const portrait = signage && orientation === "portrait"
  const standMode = stand ?? (signage ? "none" : "studio")

  const panelWidth = portrait ? S.height : S.width
  const panelHeight = portrait ? S.width : S.height
  const depth = signage ? S.signage.depth : S.depth
  const radius = signage ? S.signage.radius : S.radius
  const screenSize = getDisplayScreenSize(variant, portrait ? "portrait" : "landscape")

  const panelGeometry = useDisposable(
    useMemo(
      () =>
        createRoundedSlabGeometry(panelWidth, panelHeight, depth, radius, S.bevel, tier),
      [panelWidth, panelHeight, depth, radius, tier]
    )
  )
  const faceGeometry = useDisposable(
    useMemo(
      () =>
        createRoundedPlaneGeometry(
          panelWidth - S.bevel * 2,
          panelHeight - S.bevel * 2,
          Math.max(0.005, radius - S.bevel),
          tier
        ),
      [panelWidth, panelHeight, radius, tier]
    )
  )

  const foot = S.foot
  const arm = S.arm
  const standGeometry = useDisposable(
    useMemo(() => {
      const geometry = createRoundedSlabGeometry(
        foot.width,
        foot.depth,
        foot.thickness,
        0.06,
        0.012,
        tier
      )
      geometry.rotateX(-Math.PI / 2)
      return geometry
    }, [foot.width, foot.depth, foot.thickness, tier])
  )

  // Brazo inclinado: del borde trasero del pie al dorso del panel.
  const panelCenterY = standMode === "studio" ? S.standLift + panelHeight / 2 : 0
  const footZ = -0.35
  const armBottom: [number, number] = [foot.thickness, footZ - foot.depth / 2 + 0.12]
  const armTop: [number, number] = [panelCenterY + panelHeight * 0.06, -depth / 2 - arm.thickness / 2]
  const armDy = armTop[0] - armBottom[0]
  const armDz = armTop[1] - armBottom[1]
  const armLength = Math.hypot(armDy, armDz)
  const armAngle = Math.atan2(armDz, armDy)

  const armGeometry = useDisposable(
    useMemo(
      () => createRoundedSlabGeometry(arm.width, armLength, arm.thickness, 0.03, 0.012, tier),
      [arm.width, armLength, arm.thickness, tier]
    )
  )

  const bodyMaterial = signage ? materials.trim : materials.body

  return (
    <group {...group}>
      <group position-y={panelCenterY}>
        <mesh geometry={panelGeometry} material={bodyMaterial} />
        <mesh
          geometry={faceGeometry}
          material={materials.glassBlack}
          position-z={depth / 2 + 0.0004}
        />
        <group position-z={depth / 2 + 0.0009}>
          <DeviceScreen
            {...screen}
            width={screenSize.width}
            height={screenSize.height}
            radius={S.screenRadius}
            tier={tier}
            envMap={envMap}
          />
        </group>
        {tier !== "low" ? (
          <mesh
            geometry={faceGeometry}
            material={signage ? materials.trim : materials.body}
            position-z={-depth / 2 - 0.0004}
            rotation-y={Math.PI}
          />
        ) : null}
      </group>

      {standMode === "studio" ? (
        <>
          <mesh
            geometry={standGeometry}
            material={materials.body}
            position={[0, foot.thickness / 2, footZ]}
          />
          <mesh
            geometry={armGeometry}
            material={materials.body}
            position={[0, (armBottom[0] + armTop[0]) / 2, (armBottom[1] + armTop[1]) / 2]}
            rotation-x={armAngle}
          />
        </>
      ) : null}

      {children}
    </group>
  )
}
