import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  CanvasTexture,
  CylinderGeometry,
  MathUtils,
  MeshStandardMaterial,
  PlaneGeometry,
  type Group,
} from "three"

import { experienceStore } from "@/experience/store"

import { DeviceScreen } from "./DeviceScreen"
import {
  buildKeyboardLayout,
  createKeyboardGeometry,
  createRoundedPlaneGeometry,
  createRoundedSlabGeometry,
} from "./geometry"
import { useDeviceTier, useDisposable } from "./hooks"
import { useDeviceMaterials, useStudioEnvironment } from "./materials"
import type { DeviceBaseProps } from "./Phone"
import {
  LAPTOP_SCREEN,
  LAPTOP_SPEC,
  resolveScalar,
  type DynamicScalar,
} from "./specs"

export type LaptopProps = DeviceBaseProps & {
  /**
   * Apertura de la tapa: `0` cerrada → `1` abierta (≈ 107° respecto a la base).
   * Animable sin re-render (número, getter o ref). Por defecto `1`.
   */
  open?: DynamicScalar
  /** Amortiguación de la tapa hacia `open` (0 = instantáneo). Por defecto `0`. */
  openDamping?: number
  /** Notch de cámara en la pantalla. Por defecto `true`. */
  notch?: boolean
}

const S = LAPTOP_SPEC
const LID_HEIGHT = S.depth - S.lidThickness / 2 - 0.006

/** Rejilla de parlantes (agujeros) como `alphaMap` de 32×256. */
function createGrilleTexture(): CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 32
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, 32, 256)
    ctx.fillStyle = "#fff"
    for (let y = 3; y < 256; y += 5) {
      for (let x = 3 + ((y / 5) % 2) * 2.5; x < 30; x += 5) {
        ctx.beginPath()
        ctx.arc(x, y, 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  return new CanvasTexture(canvas)
}

/**
 * Laptop de 14" con base y tapa de aluminio, teclado completo (una sola malla),
 * trackpad de vidrio satinado, rejillas de parlantes, bisagra y pantalla con
 * notch. Origen en el centro de la cara inferior de la base (apoya en `y = 0`);
 * la pantalla abierta mira a +Z.
 */
export function Laptop({
  quality,
  finish = "space-black",
  screen,
  envIntensity = 1,
  open = 1,
  openDamping = 0,
  notch = true,
  children,
  ...group
}: LaptopProps) {
  const tier = useDeviceTier(quality)
  const envMap = useStudioEnvironment()
  const materials = useDeviceMaterials({ finish, tier, envMap, envIntensity })

  const baseGeometry = useDisposable(
    useMemo(() => {
      const geometry = createRoundedSlabGeometry(
        S.width,
        S.depth,
        S.baseThickness,
        S.radius,
        S.bevel,
        tier
      )
      geometry.rotateX(-Math.PI / 2)
      geometry.translate(0, S.baseThickness / 2, 0)
      return geometry
    }, [tier])
  )

  const kb = S.keyboard
  const wellGeometry = useDisposable(
    useMemo(() => {
      const geometry = createRoundedPlaneGeometry(kb.width, kb.depth, 0.035, tier)
      geometry.rotateX(-Math.PI / 2)
      return geometry
    }, [kb.width, kb.depth, tier])
  )
  const keysGeometry = useDisposable(
    useMemo(
      () => createKeyboardGeometry(buildKeyboardLayout(kb.unit, kb.gap), 0.0055, tier),
      [kb.unit, kb.gap, tier]
    )
  )

  const tp = S.trackpad
  const trackpadGeometry = useDisposable(
    useMemo(() => {
      const geometry = createRoundedPlaneGeometry(tp.width, tp.depth, tp.radius, tier)
      geometry.rotateX(-Math.PI / 2)
      return geometry
    }, [tp.width, tp.depth, tp.radius, tier])
  )

  const grilleGeometry = useDisposable(
    useMemo(() => {
      const geometry = new PlaneGeometry(0.12, kb.depth * 0.96)
      geometry.rotateX(-Math.PI / 2)
      return geometry
    }, [kb.depth])
  )
  const grilleMaterial = useDisposable(
    useMemo(
      () =>
        new MeshStandardMaterial({
          color: "#020202",
          roughness: 0.9,
          alphaMap: createGrilleTexture(),
          transparent: true,
          depthWrite: false,
        }),
      []
    )
  )
  useEffect(() => () => grilleMaterial.alphaMap?.dispose(), [grilleMaterial])

  const lidGeometry = useDisposable(
    useMemo(() => {
      const geometry = createRoundedSlabGeometry(
        S.width,
        LID_HEIGHT,
        S.lidThickness,
        S.radius,
        0.016,
        tier
      )
      geometry.translate(0, LID_HEIGHT / 2, 0)
      return geometry
    }, [tier])
  )
  const bezelGeometry = useDisposable(
    useMemo(() => {
      const inset = 0.014
      const geometry = createRoundedPlaneGeometry(
        S.width - inset * 2,
        LID_HEIGHT - inset * 2,
        S.radius - inset,
        tier
      )
      geometry.translate(0, LID_HEIGHT / 2, 0)
      return geometry
    }, [tier])
  )
  const notchGeometry = useDisposable(
    useMemo(
      () => createRoundedPlaneGeometry(S.notch.width, S.notch.height, 0.022, tier),
      [tier]
    )
  )
  const hingeGeometry = useDisposable(
    useMemo(() => {
      const geometry = new CylinderGeometry(
        S.lidThickness * 0.5,
        S.lidThickness * 0.5,
        S.width * 0.78,
        tier === "high" ? 28 : 16
      )
      geometry.rotateZ(Math.PI / 2)
      return geometry
    }, [tier])
  )

  const lidRef = useRef<Group>(null)
  const currentOpen = useRef<number | null>(null)

  useFrame((_, delta) => {
    const lid = lidRef.current
    if (!lid) return
    const target = MathUtils.clamp(resolveScalar(open, 1), 0, 1)
    const reduced = experienceStore.getSnapshot().reducedMotion
    if (currentOpen.current === null || openDamping <= 0 || reduced) {
      currentOpen.current = target
    } else {
      currentOpen.current = MathUtils.damp(currentOpen.current, target, openDamping, delta)
    }
    // 0 → tapa apoyada sobre la base (π/2); 1 → inclinada hacia atrás.
    lid.rotation.x = MathUtils.lerp(Math.PI / 2, -S.openTilt, currentOpen.current)
  })

  const deckY = S.baseThickness + 0.0006
  const wellZ = -S.depth / 2 + kb.inset + kb.depth / 2
  const trackpadZ = S.depth / 2 - tp.inset - tp.depth / 2
  const hingeY = S.baseThickness + S.lidThickness / 2
  const hingeZ = -S.depth / 2 + S.lidThickness / 2
  const zFace = S.lidThickness / 2
  const richTier = tier !== "low"

  return (
    <group {...group}>
      <mesh geometry={baseGeometry} material={materials.body} />
      <mesh geometry={wellGeometry} material={materials.void} position={[0, deckY, wellZ]} />
      <mesh
        geometry={keysGeometry}
        material={materials.trim}
        position={[0, deckY, wellZ + 0.012]}
      />
      <mesh
        geometry={trackpadGeometry}
        material={materials.bodySatin}
        position={[0, deckY, trackpadZ]}
      />
      {richTier ? (
        <>
          <mesh
            geometry={grilleGeometry}
            material={grilleMaterial}
            position={[-(kb.width / 2 + 0.1), deckY + 0.0004, wellZ]}
          />
          <mesh
            geometry={grilleGeometry}
            material={grilleMaterial}
            position={[kb.width / 2 + 0.1, deckY + 0.0004, wellZ]}
          />
        </>
      ) : null}

      <mesh geometry={hingeGeometry} material={materials.trim} position={[0, hingeY, hingeZ]} />

      <group ref={lidRef} position={[0, hingeY, hingeZ]}>
        <mesh geometry={lidGeometry} material={materials.body} />
        <mesh geometry={bezelGeometry} material={materials.glassBlack} position-z={zFace + 0.0004} />
        <group position={[0, S.chin + LAPTOP_SCREEN.height / 2, zFace + 0.0009]}>
          <DeviceScreen
            {...screen}
            width={LAPTOP_SCREEN.width}
            height={LAPTOP_SCREEN.height}
            radius={S.screenRadius}
            tier={tier}
            envMap={envMap}
          />
          {notch && richTier ? (
            <mesh
              geometry={notchGeometry}
              material={materials.void}
              position={[0, LAPTOP_SCREEN.height / 2 - S.notch.height / 2 + 0.012, 0.0014]}
              renderOrder={7}
            />
          ) : null}
        </group>
      </group>
      {children}
    </group>
  )
}
