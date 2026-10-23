import { useContext, useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Group, Light, MeshStandardMaterial } from "three"
import type { SceneProps } from "@/experience/types"
import { useExperienceStore } from "@/experience/hooks"
import { ramp } from "@/experience/choreography"
import { PresentationContext, revealHtml } from "@/experience/presentation"
import { useGreyboxRig, type CameraFrame } from "@/scenes/greybox/runtime"
import {
  Display,
  KitHtml,
  ThreadLine,
  useStudioEnvironment,
} from "@/scenes/kit"
import { createRoundedSlabGeometry } from "@/scenes/kit/devices/geometry"
import { useBannerClips } from "./media"
import { InterfaceSlides, VideoCrossfade } from "./Screens"

const POSE = {
  desktop: [0.6, 0.7, 13],
  mobile: [0, 0.65, 11.25],
  target: [0, 0, 0],
  mobileTarget: [0, 0.4, 0],
} satisfies Omit<CameraFrame, "at">
const FRAMES = [
  { at: 0, ...POSE },
  { at: 0.82, ...POSE, desktop: [0.5, 0.65, 11.5], mobile: [0, 0.65, 10.45] },
  { at: 1, ...POSE, desktop: [0.5, 0.65, 11.5], mobile: [0, 0.65, 10.45] },
] satisfies Parameters<typeof useGreyboxRig>[2]
const STILL_FRAMES = [
  { at: 0, ...POSE },
  { at: 1, ...POSE },
]

function MonitorBase() {
  const envMap = useStudioEnvironment()
  const geometry = useMemo(
    () => createRoundedSlabGeometry(6.65, 1.65, 0.16, 0.22, 0.025, "medium"),
    []
  )
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#43362f",
        metalness: 0.65,
        roughness: 0.34,
        envMap,
        envMapIntensity: 0.8,
      }),
    [envMap]
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, -1.99, -0.18]}
      rotation-x={-Math.PI / 2}
    />
  )
}

/** One brief scene: product interface and connected screens, then Starbene. */
export default function BannerScene(props: SceneProps) {
  const { isMobile, quality, progress } = props
  const { reducedMotion } = useExperienceStore()
  const presentation = useContext(PresentationContext)
  const copy = useRef<HTMLDivElement>(null)
  const lights = useRef<Group>(null)
  const textures = useBannerClips(props)
  const positions = useMemo<[number, number, number][]>(
    () =>
      isMobile
        ? [
            [-0.95, -1.9, 0],
            [0.95, -1.9, 0],
          ]
        : [
            [-4.65, 1.15, -0.7],
            [4.65, 1.15, -0.7],
            [-4.65, -1.05, -0.7],
            [4.65, -1.05, -0.7],
          ],
    [isMobile]
  )
  useGreyboxRig(props, "#151211", reducedMotion ? STILL_FRAMES : FRAMES)
  useFrame(() => {
    const opacity = presentation?.current.opacity ?? 1
    for (const light of lights.current?.children ?? []) {
      if (!(light instanceof Light)) continue
      light.userData.bannerIntensity ??= light.intensity
      light.intensity = light.userData.bannerIntensity * opacity
    }
    revealHtml(copy.current, opacity * (1 - ramp(progress.current, 0.88, 1)))
  }, -1)
  return (
    <group>
      <group ref={lights}>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[-4, 6, 8]}
          color="#ffe3d3"
          intensity={2.5}
        />
        <directionalLight position={[5, 3, -4]} color="#bdc2ff" intensity={3} />
        <pointLight
          position={[2, -2, 4]}
          color="#ffb5a0"
          intensity={18}
          distance={15}
        />
      </group>
      <mesh position={[0, 0, -2.5]}>
        <planeGeometry args={[27, 17]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={{ uOpacity: { value: 1 } }}
          vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec2 vUv;uniform float uOpacity;void main(){float d=length((vUv-vec2(.5,.46))*vec2(1.25,1.));float a=exp(-d*d*15.)*.24;gl_FragColor=vec4(.32,.22,.19,a*uOpacity);}`}
        />
      </mesh>
      <group
        position={isMobile ? [0, 0.6, 0.35] : [0, 0, 0.35]}
        scale={isMobile ? 0.59 : 0.91}
      >
        <Display
          variant="monitor"
          stand="none"
          finish="graphite"
          quality={quality}
          envIntensity={0.8}
          screen={{ glare: false, power: 0 }}
        >
          <InterfaceSlides progress={progress} isMobile={isMobile} />
        </Display>
        <MonitorBase />
      </group>
      {positions.map((position, i) => (
        <Display
          key={i}
          variant="signage"
          finish="graphite"
          quality="low"
          scale={isMobile ? 0.25 : 0.32}
          position={position}
          rotation-y={isMobile ? 0 : position[0] > 0 ? -0.14 : 0.14}
          screen={{ glare: false, power: 0 }}
        >
          <VideoCrossfade
            progress={progress}
            isMobile={isMobile}
            slot={i}
            textures={textures}
          />
        </Display>
      ))}
      {positions.map((position, i) => (
        <ThreadLine
          key={i}
          quality={quality}
          progress={progress}
          points={[
            [0, -0.1, -0.3],
            [position[0] * 0.6, position[1] * 0.5, -0.5],
            position,
          ]}
          color="#BDC2FF"
          width={0.012}
          showHead={false}
          draw={[0, 0.08]}
        />
      ))}
      <KitHtml>
        <div
          ref={copy}
          data-banner-caption
          style={{
            position: "absolute",
            top: isMobile ? "28%" : "18%",
            left: "5%",
            right: "5%",
            textAlign: "center",
            fontFamily: "Poppins,sans-serif",
            color: "#EDE0DD",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: isMobile ? 18 : 27,
              fontWeight: 500,
              letterSpacing: "-.04em",
              lineHeight: 1.3,
            }}
          >
            Controlá lo que se ve. En todas partes.
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: isMobile ? 10 : 13,
              color: "#D8C2BC",
            }}
          >
            Un solo lugar para coordinar todas tus pantallas.
          </div>
        </div>
      </KitHtml>
    </group>
  )
}
