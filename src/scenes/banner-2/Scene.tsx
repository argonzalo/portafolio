import { useLayoutEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import {
  Color,
  Object3D,
  type Group,
  type InstancedMesh,
  type Mesh,
  type ShaderMaterial,
} from "three"
import type { SceneProps } from "@/experience/types"
import { phase, useGreyboxRig } from "@/scenes/greybox/runtime"

const FRAMES = [
  { at: 0, desktop: [0, 0.6, 10], mobile: [0, 0.5, 12], target: [0, 0, 0] },
  { at: 0.3, desktop: [0.6, 1, 15], mobile: [0, 0.8, 17], target: [0, 0, 0] },
  { at: 0.5, desktop: [1.2, 1, 10], mobile: [0, 0.5, 13], target: [0, 0, 0] },
  { at: 0.7, desktop: [0, 0.5, 14], mobile: [0, 0.5, 18], target: [0, 0, 0] },
  {
    at: 0.95,
    desktop: [0.4, 0.4, 10],
    mobile: [0, 0.5, 12],
    target: [0, 0, 0],
  },
] satisfies Parameters<typeof useGreyboxRig>[2]

const COPY = [
  "01 / UNA PANTALLA",
  "02 / SIN COORDINACIÓN",
  "03 / REGIÓN · FECHA · ENTIDAD",
  "04 / PUBLICAR → BROKER → WORKERS",
  "05 / ≈10.000 EQUIPOS ACTIVOS",
]

function Panel({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color = "#DA3E00",
}: {
  position?: [number, number, number]
  scale?: [number, number, number]
  color?: string
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <boxGeometry args={[2.5, 1.5, 0.12]} />
        <meshBasicMaterial color="#312724" />
      </mesh>
      <mesh position={[0, 0, 0.071]}>
        <planeGeometry args={[2.35, 1.35]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[-0.38, 0.26, 0.08]}>
        <planeGeometry args={[1.2, 0.08]} />
        <meshBasicMaterial color="#FFE5DB" />
      </mesh>
      <mesh position={[-0.6, 0.05, 0.08]}>
        <planeGeometry args={[0.75, 0.05]} />
        <meshBasicMaterial color="#FFB5A0" />
      </mesh>
    </group>
  )
}

/** Repeated screens share geometry/material; no text or DOM per instance. */
function ScreenField({
  progress,
  isMobile,
  quality,
  mode,
}: SceneProps & { mode: "chaos" | "map" }) {
  const ref = useRef<InstancedMesh>(null)
  const material = useRef<ShaderMaterial>(null)
  const count =
    mode === "chaos"
      ? 180
      : quality === "high"
        ? 10000
        : quality === "medium"
          ? 2500
          : 900
  const side = Math.ceil(Math.sqrt(count))
  const uniforms = useMemo(() => ({ uProgress: { value: 0 } }), [])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const object = new Object3D()
    const color = new Color()
    for (let i = 0; i < count; i++) {
      const x = i % side
      const y = Math.floor(i / side)
      if (mode === "map") {
        object.position.set(
          (x / side - 0.5) * 11,
          (y / side - 0.5) * 5.8 - 0.6,
          -0.4
        )
        object.scale.set(7.5 / side, 4.6 / side, 1)
      } else {
        object.position.set(
          Math.sin(i * 17.3) * 7,
          Math.cos(i * 7.1) * 4,
          -1 - (i % 8) * 0.35
        )
        object.rotation.set(0, Math.sin(i) * 0.3, Math.sin(i * 4) * 0.2)
        object.scale.set(0.8, 0.45, 1)
      }
      object.updateMatrix()
      mesh.setMatrixAt(i, object.matrix)
      color.set(
        mode === "map"
          ? x < side / 3
            ? "#DA3E00"
            : x < (side * 2) / 3
              ? "#FFB5A0"
              : "#FFE5DB"
          : ["#DA3E00", "#62504A", "#B4A499", "#8E3420"][i % 4]
      )
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [count, side, mode])
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const p = progress.current
    mesh.visible = mode === "chaos" ? p >= 0.2 && p < 0.4 : p >= 0.6 && p < 0.8
    if (material.current)
      material.current.uniforms.uProgress.value = phase(p, 0.63, 0.78)
    if (mode === "chaos") mesh.rotation.y = phase(p, 0.2, 0.4) * 0.3
    else mesh.scale.setScalar(isMobile ? 0.77 : 1)
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      {mode === "chaos" ? (
        <meshBasicMaterial />
      ) : (
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={`varying vec3 vColor; varying float vRegion;
        void main() { vColor = instanceColor; vRegion = (instanceMatrix[3].x + 5.5) / 11.0;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`}
          fragmentShader={`uniform float uProgress; varying vec3 vColor; varying float vRegion;
        void main() { float on = smoothstep(vRegion - 0.06, vRegion + 0.06, uProgress);
          gl_FragColor = vec4(mix(vec3(0.12,0.09,0.08), vColor, on), 1.0); }`}
          toneMapped={false}
        />
      )}
    </instancedMesh>
  )
}

export default function BannerScene(props: SceneProps) {
  const { progress, active, isMobile } = props
  const hero = useRef<Group>(null)
  const editor = useRef<Group>(null)
  const graph = useRef<Group>(null)
  const wall = useRef<Group>(null)
  const layers = useRef<Group>(null)
  const pulse = useRef<Mesh>(null)
  const caption = useRef<HTMLDivElement>(null)
  useGreyboxRig(props, "#151211", FRAMES)
  useFrame(() => {
    const p = progress.current
    const beat = Math.min(4, Math.floor(p * 5))
    if (hero.current) hero.current.visible = p < 0.4
    if (editor.current) editor.current.visible = p >= 0.4 && p < 0.6
    if (graph.current) graph.current.visible = p >= 0.6 && p < 0.8
    if (wall.current) wall.current.visible = p >= 0.8
    if (layers.current) {
      layers.current.position.z = phase(p, 0.4, 0.59) * 1.2
      layers.current.rotation.y = -phase(p, 0.4, 0.6) * 0.2
    }
    if (pulse.current) {
      pulse.current.position.x = -4.4 + phase(p, 0.6, 0.73) * 8.8
      pulse.current.scale.setScalar(p < 0.74 ? 1 : 0)
    }
    if (caption.current) {
      caption.current.textContent = COPY[beat]
      caption.current.style.visibility = active ? "visible" : "hidden"
    }
  })
  const columns = isMobile ? 2 : 4
  return (
    <group>
      <group ref={hero}>
        <Panel scale={[1.4, 1.4, 1.4]} />
      </group>
      <ScreenField {...props} mode="chaos" />
      <ScreenField {...props} mode="map" />
      <group ref={editor} scale={isMobile ? 0.8 : 1}>
        <Panel position={[-0.3, 0, -0.4]} scale={[2, 2, 1]} color="#2D211D" />
        <group ref={layers}>
          <Panel position={[-0.8, 0.35, 0.2]} scale={[0.95, 0.95, 1]} />
          <mesh position={[1.1, 0.3, 0.5]}>
            <planeGeometry args={[0.9, 1.9]} />
            <meshBasicMaterial color="#FFB5A0" transparent opacity={0.5} />
          </mesh>
          <mesh position={[1.5, 0.05, 0.8]}>
            <planeGeometry args={[0.9, 1.9]} />
            <meshBasicMaterial color="#DA3E00" transparent opacity={0.55} />
          </mesh>
          <mesh position={[1.9, -0.2, 1.1]}>
            <planeGeometry args={[0.9, 1.9]} />
            <meshBasicMaterial color="#FFE5DB" transparent opacity={0.45} />
          </mesh>
        </group>
      </group>
      <group ref={graph} position={[0, 2.3, 0]} scale={isMobile ? 0.8 : 1}>
        <mesh position={[-3.5, 0, 0]}>
          <boxGeometry args={[0.8, 0.7, 0.2]} />
          <meshBasicMaterial color="#DA3E00" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.8, 0.3]} />
          <meshBasicMaterial color="#FFB5A0" />
        </mesh>
        <mesh position={[-1.8, 0, 0]}>
          <boxGeometry args={[2.6, 0.025, 0.025]} />
          <meshBasicMaterial color="#DA3E00" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={i}>
            <mesh position={[3, (i - 1) * 0.65, 0]}>
              <boxGeometry args={[0.5, 0.35, 0.2]} />
              <meshBasicMaterial color="#FFB5A0" />
            </mesh>
            <mesh
              position={[1.8, (i - 1) * 0.32, 0]}
              rotation={[0, 0, (i - 1) * 0.26]}
            >
              <boxGeometry args={[2.4, 0.025, 0.025]} />
              <meshBasicMaterial color="#DA3E00" />
            </mesh>
          </group>
        ))}
        <mesh ref={pulse}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshBasicMaterial color="#FFF0E9" />
        </mesh>
      </group>
      <group ref={wall} scale={isMobile ? 0.8 : 1}>
        <mesh position={[0, -0.2, -0.3]}>
          <boxGeometry args={[isMobile ? 6 : 11.5, 4.8, 0.2]} />
          <meshBasicMaterial color="#251C18" />
        </mesh>
        {Array.from({ length: columns * 2 }, (_, i) => (
          <Panel
            key={i}
            position={[
              ((i % columns) - (columns - 1) / 2) * 2.65,
              (Math.floor(i / columns) - 0.5) * 1.7,
              0,
            ]}
            color="#DA3E00"
          />
        ))}
      </group>
      <Html position={[0, 3.5, 0]} center style={{ pointerEvents: "none" }}>
        <div
          ref={caption}
          style={{
            color: "#FFB5A0",
            font: "11px monospace",
            letterSpacing: ".12em",
            whiteSpace: "nowrap",
          }}
        >
          {COPY[0]}
        </div>
      </Html>
    </group>
  )
}
