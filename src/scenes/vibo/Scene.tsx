import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import { Group, InstancedMesh, Object3D } from "three"
import type { SceneProps } from "@/experience/types"
import { emitInteract } from "@/guide/signals"
import { phase, useGreyboxRig, type CameraFrame } from "../greybox/runtime"

const cameras: CameraFrame[] = [
  { at: 0, desktop: [10, 9, 13], mobile: [12, 15, 21], target: [0, 0, 0] },
  { at: 0.3, desktop: [5, 3.5, 7], mobile: [4, 3.8, 9], target: [0, 1, 0] },
  { at: 0.55, desktop: [4, 4, 8], mobile: [5, 5, 11], target: [0, 1, 0] },
  { at: 0.7, desktop: [0, 15, 0.1], mobile: [0, 22, 0.1], target: [0, 0, 0] },
  { at: 1, desktop: [8, 7, 11], mobile: [9, 12, 17], target: [0, 0, 0] },
]
const pipeline = [
  "Detección",
  "Seguimiento",
  "Calibración",
  "Golpes",
  "Clasificación",
]

export default function ViboScene(props: SceneProps) {
  useGreyboxRig(props, "#071426", cameras)
  const player = useRef<Group>(null)
  const arm = useRef<Group>(null)
  const overlay = useRef<Group>(null)
  const heat = useRef<InstancedMesh>(null)
  const ui = useRef<HTMLDivElement>(null)
  const pipelineRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const scrub = useRef<number | null>(null)
  const paused = useRef(false)
  const pose = useRef(0)
  const [isPaused, setPaused] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const dummyRef = useRef(new Object3D())
  const low = props.quality === "low"
  useFrame(() => {
    const dummy = dummyRef.current
    const p = props.progress.current
    if (!paused.current && scrub.current === null)
      pose.current = phase(p, 0.22, 0.54)
    const t = scrub.current ?? pose.current
    if (resultRef.current) resultRef.current.hidden = !props.active || p < 0.8
    if (arm.current) arm.current.rotation.z = -1.6 + t * 2.6
    if (player.current) player.current.rotation.y = -0.45 + t * 0.8
    if (overlay.current) overlay.current.visible = p >= 0.23 && p < 0.6
    if (ui.current) ui.current.hidden = !props.active || p < 0.2 || p >= 0.58
    if (pipelineRef.current) {
      pipelineRef.current.style.visibility =
        !props.active || p < 0.25 || p >= 0.58 ? "hidden" : "visible"
      Array.from(pipelineRef.current.children).forEach((node, i) => {
        ;(node as HTMLElement).style.opacity =
          p > 0.25 + i * 0.055 ? "1" : "0.25"
      })
    }
    if (heat.current) {
      heat.current.visible = p >= 0.58
      for (let i = 0; i < 24; i++) {
        dummy.position.set(
          ((i % 4) - 1.5) * 1.7,
          0.035,
          (Math.floor(i / 4) - 2.5) * 1.7
        )
        dummy.scale.setScalar(
          (0.5 + Math.sin(i * 12.7) * 0.25) * phase(p, 0.58, 0.7)
        )
        dummy.rotation.x = -Math.PI / 2
        dummy.updateMatrix()
        heat.current.setMatrixAt(i, dummy.matrix)
      }
      heat.current.instanceMatrix.needsUpdate = true
    }
  })
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[10, 16]} />
        <meshBasicMaterial color="#102b48" />
      </mesh>
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.035, 0.025, 16]} />
          <meshBasicMaterial color="#82b9e9" />
        </mesh>
      ))}
      {[-8, -4, 0, 4, 8].map((z) => (
        <mesh key={z} position={[0, 0.02, z]}>
          <boxGeometry args={[10, 0.025, 0.035]} />
          <meshBasicMaterial color="#82b9e9" />
        </mesh>
      ))}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[10, 1.3, 0.035]} />
        <meshBasicMaterial color="#7592ab" wireframe />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <group key={`${x}/${z}`} position={[x * 5, 0, z * 7]}>
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[0.06, 4, 0.06]} />
              <meshBasicMaterial color="#486781" />
            </mesh>
            <mesh position={[0, 4, 0]}>
              <boxGeometry args={[0.65, 0.12, 0.25]} />
              <meshBasicMaterial color="#cce8ff" />
            </mesh>
          </group>
        ))
      )}
      <group ref={player} position={[0, 0, 2]}>
        <mesh position={[0, 1.7, 0]}>
          <boxGeometry args={[0.65, 0.9, 0.35]} />
          <meshBasicMaterial color="#3c84d8" />
        </mesh>
        <mesh position={[0, 2.45, 0]}>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshBasicMaterial color="#e3d6c1" />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.22, 0.65, side * 0.12]}
            rotation-z={side * 0.15}
          >
            <boxGeometry args={[0.22, 1.3, 0.25]} />
            <meshBasicMaterial color="#b4c9db" />
          </mesh>
        ))}
        <group ref={arm} position={[0.35, 2, 0]}>
          <mesh position={[0.48, 0, 0]}>
            <boxGeometry args={[1, 0.18, 0.2]} />
            <meshBasicMaterial color="#e3d6c1" />
          </mesh>
          <mesh position={[1.12, 0, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.3, 0.3, 0.08, low ? 6 : 12]} />
            <meshBasicMaterial color="#f5c451" />
          </mesh>
        </group>
        <group ref={overlay}>
          <mesh position={[0, 1.45, 0]}>
            <boxGeometry args={[1.8, 3, 0.7]} />
            <meshBasicMaterial
              color={highlight ? "#f5c451" : "#51beff"}
              wireframe
            />
          </mesh>
          {[0.6, 1.3, 2, 2.45].map((y) => (
            <mesh key={y} position={[0, y, 0.25]}>
              <icosahedronGeometry args={[0.07, 0]} />
              <meshBasicMaterial color="#f5c451" />
            </mesh>
          ))}
        </group>
      </group>
      <instancedMesh ref={heat} args={[undefined, undefined, 24]}>
        <circleGeometry args={[1, low ? 8 : 16]} />
        <meshBasicMaterial color="#e6b652" transparent opacity={0.5} />
      </instancedMesh>
      <Html fullscreen style={{ pointerEvents: "none" }}>
        <div
          ref={pipelineRef}
          style={{
            display: "flex",
            position: "absolute",
            right: "5%",
            top: "30%",
            flexDirection: props.isMobile ? "column" : "row",
            gap: 6,
            color: "#c8e1ff",
            fontSize: 11,
            whiteSpace: "nowrap",
          }}
        >
          {pipeline.map((label) => (
            <span key={label} style={{ background: "#102b48", padding: 6 }}>
              {label}
            </span>
          ))}
        </div>
      </Html>
      <Html fullscreen style={{ pointerEvents: "none" }}>
        <div
          ref={resultRef}
          hidden
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "min(80vw,360px)",
            background: "#071426ed",
            padding: 24,
            color: "#f5c451",
            border: "1px solid #f5c451",
          }}
        >
          <h3 style={{ fontSize: 23, marginBottom: 12 }}>
            Tu lectura de partido
          </h3>
          <p style={{ fontSize: 13, lineHeight: 2 }}>
            Estilo de juego
            <br />
            Repertorio de golpes
            <br />
            Desgaste a lo largo del partido
          </p>
        </div>
        <div
          ref={ui}
          hidden
          style={{
            position: "absolute",
            bottom: props.isMobile ? "24%" : "15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(85vw,360px)",
            background: "#071426ed",
            padding: 14,
            color: "#edf5ff",
            pointerEvents: props.active ? "auto" : "none",
            border: "1px solid #408dff",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{ minHeight: 44 }}
              aria-pressed={isPaused}
              onClick={() => {
                paused.current = !paused.current
                scrub.current = null
                setPaused(paused.current)
                emitInteract("vibo:pause")
              }}
            >
              {isPaused ? "Seguir scroll" : "Pausar golpe"}
            </button>
            <button
              type="button"
              aria-pressed={highlight}
              style={{ minHeight: 44 }}
              onClick={() => {
                setHighlight(!highlight)
                emitInteract("vibo:overlay")
              }}
            >
              Resaltar detección
            </button>
          </div>
          <label style={{ display: "block", fontSize: 12 }}>
            Arrastrá para explorar el golpe
            <input
              aria-label="Instante del golpe"
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.5"
              style={{ width: "100%", minHeight: 44, touchAction: "pan-y" }}
              onChange={(e) => {
                scrub.current = Number(e.target.value)
                paused.current = true
                setPaused(true)
                emitInteract("vibo:scrub")
              }}
            />
          </label>
        </div>
      </Html>
    </group>
  )
}
