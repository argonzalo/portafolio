import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { AdditiveBlending, Color, type Group } from "three"
import type { SceneProps } from "@/experience/types"
import { reveal } from "@/experience/presentation"
import { ramp } from "@/experience/choreography"
import { LAPTOP_SCREEN, LAPTOP_SPEC as S } from "../kit/devices/specs"
import { arrivalPulse } from "./timing"

/** A soft sage rim around the receiving screen, without washing out its UI. */
export function ArrivalGlow({ progress }: Pick<SceneProps, "progress">) {
  const lid = useRef<Group>(null)
  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uColor: { value: new Color("#8cd5bc") },
    }),
    []
  )
  useFrame(() => {
    if (!lid.current) return
    lid.current.rotation.x =
      Math.PI / 2 +
      (-S.openTilt - Math.PI / 2) * ramp(progress.current, 0.405, 0.49)
    reveal(lid.current, arrivalPulse(progress.current))
  }, -1)
  return (
    <group
      ref={lid}
      position={[
        0,
        S.baseThickness + S.lidThickness / 2,
        -S.depth / 2 + S.lidThickness / 2,
      ]}
    >
      <mesh
        position={[
          0,
          S.chin + LAPTOP_SCREEN.height / 2,
          S.lidThickness / 2 + 0.005,
        ]}
        renderOrder={8}
      >
        <planeGeometry
          args={[LAPTOP_SCREEN.width + 0.45, LAPTOP_SCREEN.height + 0.45]}
        />
        <shaderMaterial
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          vertexShader={`varying vec2 vUv;
            void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`uniform float uOpacity;uniform vec3 uColor;varying vec2 vUv;
            void main(){
              vec2 q=abs(vUv-.5)*vec2(${LAPTOP_SCREEN.width + 0.45},${LAPTOP_SCREEN.height + 0.45})
                -vec2(${LAPTOP_SCREEN.width / 2 - 0.05},${LAPTOP_SCREEN.height / 2 - 0.05});
              float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.05;
              float glow=exp(-abs(d)*17.);
              gl_FragColor=vec4(uColor,glow*uOpacity*.8);
              #include <colorspace_fragment>
            }`}
        />
      </mesh>
    </group>
  )
}
