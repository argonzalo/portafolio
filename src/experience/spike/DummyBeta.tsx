import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"

import { disposeObject3D } from "@/experience/dispose"
import type { SceneProps } from "@/experience/types"

/**
 * Escena dummy B del spike T-A06: toro que responde al scroll.
 * Ids tipados como `pirp` solo para el contrato; no es la escena real.
 */
export default function DummyBeta({ progress, active }: SceneProps) {
  const root = useRef<Group>(null)
  const mesh = useRef<Mesh>(null)

  useLayoutEffect(() => {
    const group = root.current
    return () => {
      if (group) disposeObject3D(group)
    }
  }, [])

  useFrame((_, delta) => {
    const target = mesh.current
    if (!target) return

    const p = progress.current
    target.rotation.x = p * Math.PI
    target.rotation.y = p * Math.PI * 1.5
    target.position.x = (p - 0.5) * 1.4
    target.scale.setScalar(0.9 + p * 0.35)

    if (active) {
      target.rotation.z += delta * 0.25
    }
  })

  return (
    <group ref={root}>
      <mesh ref={mesh}>
        <torusKnotGeometry args={[0.75, 0.28, 128, 24]} />
        <meshStandardMaterial
          color="#fbbf24"
          roughness={0.4}
          metalness={0.35}
          wireframe={!active}
        />
      </mesh>
      <ambientLight intensity={0.4} />
      <directionalLight position={[-2, 3, 4]} intensity={1.35} />
    </group>
  )
}
