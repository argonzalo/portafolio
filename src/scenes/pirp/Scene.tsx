import { useContext, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import {
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Object3D,
  ShaderMaterial,
  DoubleSide,
} from "three"
import type { SceneProps } from "@/experience/types"
import { PresentationContext, reveal } from "@/experience/presentation"
import { envelope, ramp } from "@/experience/choreography"
import { useGreyboxRig } from "../greybox/runtime"
import { KitHtml } from "../kit/KitHtml"
import { useScreenTexture } from "../kit/devices/screenTexture"

import { Phone } from "../kit/devices/Phone"
import { useDisposable } from "../kit/devices/hooks"
import { createRoundedPlaneGeometry } from "../kit/devices/geometry"
import { ThreadLine } from "../kit/ThreadLine"
import { PirpOverlay } from "./Overlay"
import { pirp } from "./definition"
import data from "./dataset.json"
import captureDimensions from "./capture-dimensions.json"

const cameras = [
  { at: 0, desktop: [0, 0, 10], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 0.35, desktop: [0.4, 0.2, 10], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 0.65, desktop: [0, 0, 9], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 0.88, desktop: [0, 0, 9], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 1, desktop: [0, 0, 8.5], mobile: [0, 0, 10], target: [0, 0, 0] },
] satisfies Parameters<typeof useGreyboxRig>[2]

// Layout curado, fijo: no hay simulación ni layout de grafos en el cliente.
const nodes: [number, number, number][] = [
  [-2.5, 0.85, 0],
  [-0.9, -0.8, 0.5],
  [1.05, 1, 0.2],
  [2.65, -0.5, 0],
]
const mobileNodes: [number, number, number][] = [
  [-0.85, 0.45, 0],
  [0.8, -0.25, 0.2],
  [-0.85, -1.15, 0.2],
  [0.8, -1.95, 0],
]

export default function PirpScene(props: SceneProps) {
  const presentation = useContext(PresentationContext)
  useGreyboxRig(props, pirp.palette.background, cameras)
  const stream = useRef<InstancedMesh>(null)
  const captureSize = captureDimensions[0]
  const screenAspect = captureSize.width / captureSize.height
  const phone = useRef<Group>(null)
  const signal = useRef<Group>(null)
  const count =
    props.isMobile || props.quality === "low"
      ? 36
      : props.quality === "medium"
        ? 60
        : 96
  const targets = props.isMobile ? mobileNodes : nodes
  const dummy = useMemo(() => new Object3D(), [])
  const texture = useScreenTexture("/textures/pirp/headlines.webp")

  const geometry = useDisposable(
    useMemo(() => {
      const g = createRoundedPlaneGeometry(1.5, 1, 0.055, "low")
      g.setAttribute(
        "tile",
        new InstancedBufferAttribute(
          Float32Array.from({ length: count }, (_, i) => i % 6),
          1
        )
      )
      return g
    }, [count])
  )
  const material = useDisposable(
    useMemo(
      () =>
        new ShaderMaterial({
          uniforms: { atlas: { value: texture }, uOpacity: { value: 1 } },
          transparent: true,
          side: DoubleSide,
          vertexShader: `attribute float tile; varying vec2 vUv;
      void main(){ float col=mod(tile,2.); float row=floor(tile/2.);
      vUv=vec2((uv.x+col)/2.,(uv.y+2.-row)/3.);
      gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.); }`,
          fragmentShader: `uniform sampler2D atlas; uniform float uOpacity; varying vec2 vUv;
      void main(){ gl_FragColor=vec4(texture2D(atlas,vUv).rgb * 0.72,uOpacity);
      #include <colorspace_fragment>
      }`,
        }),
      [texture]
    )
  )

  useFrame(() => {
    const p = props.progress.current
    reveal(signal.current, 1 - ramp(p, 0.15, 0.26))

    reveal(phone.current, envelope(p, 0.59, 1.02, 0.07))
    if (phone.current) {
      const turn = ramp(p, 0.59, 0.9)
      phone.current.position.set(
        props.isMobile ? -0.12 + turn * 0.22 : -2.55,
        props.isMobile ? -0.28 - turn * 0.1 : -0.2,
        0
      )
      phone.current.rotation.y = props.isMobile
        ? -0.3 + turn * 0.47
        : -0.22 + ramp(p, 0.6, 0.85) * 0.16
      phone.current.rotation.x = props.isMobile ? 0.09 - turn * 0.15 : 0
      phone.current.rotation.z = props.isMobile ? 0.025 - turn * 0.045 : 0
      phone.current.scale.setScalar(props.isMobile ? 3.7 + turn * 0.15 : 2.15)
    }
    if (!stream.current) return
    reveal(stream.current, envelope(p, 0.12, 0.63, 0.05))
    const organize = ramp(p, 0.36, 0.53)
    for (let i = 0; i < count; i++) {
      const item = data.headlines[i % 6]
      const topic = data.topics.findIndex((t) => t.id === item.topic)
      const target = targets[topic]
      const seed = (i * 0.61803398875) % 1
      const travel = (seed + p * 1.7) % 1
      const x = props.isMobile ? Math.sin(i * 4.1) * 1.4 : (travel - 0.5) * 14
      const y = props.isMobile ? 4 - travel * 8 : Math.sin(i * 2.3) * 2.3
      const ring = i * 2.39996
      const radius = 0.42 + (i % 5) * 0.12
      dummy.position.set(
        x * (1 - organize) + (target[0] + Math.cos(ring) * radius) * organize,
        y * (1 - organize) +
          (target[1] + Math.sin(ring) * radius * 0.6) * organize,
        -1.1 - i * 0.018
      )
      dummy.rotation.set(
        0,
        Math.sin(i) * 0.25 * (1 - organize),
        Math.sin(i) * 0.12 * (1 - organize)
      )
      dummy.scale.setScalar((props.isMobile ? 0.75 : 1) * (1 - organize * 0.78))
      dummy.updateMatrix()
      stream.current.setMatrixAt(i, dummy.matrix)
    }
    stream.current.instanceMatrix.needsUpdate = true
  }, -1)

  return (
    <group>
      <directionalLight position={[3, 5, 6]} intensity={2.2} color="#EFE9DD" />
      <hemisphereLight args={["#B7BACB", "#231117", 0.8]} />
      <pointLight position={[-4, 1, -2]} intensity={18} color="#A8434F" />
      <group ref={signal}>
        <ThreadLine
          points={[
            [-3, 0, 0],
            [-1, 0, 0],
            [-0.45, 0.6, 0],
            [0, -0.8, 0],
            [0.45, 0.25, 0],
            [0.9, 0, 0],
            [3, 0, 0],
          ]}
          color="#A8434F"
          quality={props.quality}
        />
      </group>
      <instancedMesh
        ref={stream}
        args={[geometry, material, count]}
        frustumCulled={false}
      />
      <group ref={phone}>
        <Phone
          screenAspect={screenAspect}
          quality={props.quality}
          back={false}
          screen={{
            src: "/textures/pirp/screen.webp",
            glare: false,
            fit: "cover",
          }}
        />
      </group>
      <KitHtml>
        <PirpOverlay {...props} presentation={presentation} />
      </KitHtml>
    </group>
  )
}
