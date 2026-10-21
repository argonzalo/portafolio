import { useLayoutEffect, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Group, Mesh } from "three"

import { disposeObject3D } from "@/experience/dispose"
import type { SceneProps } from "@/experience/types"

/**
 * Escena dummy A del spike T-A06: icosaedro que gira con el progreso del capítulo.
 * Ids tipados como `vibo` solo para reutilizar el contrato; no es la escena real.
 */
export default function DummyAlpha({ progress, active }: SceneProps) {
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
    target.rotation.y = p * Math.PI * 2
    target.rotation.x = p * Math.PI * 0.35
    target.position.y = Math.sin(p * Math.PI) * 0.55
    target.scale.setScalar(active ? 1 : 0.85)

    if (active) {
      target.rotation.z += delta * 0.15
    }
  })

  return (
    <group ref={root}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshStandardMaterial
          color="#7dd3fc"
          roughness={0.35}
          metalness={0.2}
          wireframe={!active}
        />
      </mesh>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 4, 2]} intensity={1.2} />
    </group>
  )
}
