import { useRef } from "react"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Color, Group, MeshBasicMaterial } from "three"
import type { SceneProps } from "@/experience/types"
import { phase, useGreyboxRig } from "../greybox/runtime"

const SAGE = "#56857D"
const CREAM = "#FAFDFC"
const NIGHT = new Color("#263E42")
const DAY = new Color(CREAM)
const DAWN = new Color("#F2EADD")
const frames = [
  {
    mobileTarget: [-0.5, 0.2, 0] as [number, number, number],
    at: 0,
    desktop: [6, 3.2, 8] as [number, number, number],
    mobile: [4, 4, 15] as [number, number, number],
    target: [-0.7, 0.2, 0] as [number, number, number],
  },
  {
    mobileTarget: [-0.5, 0.2, 0] as [number, number, number],
    at: 0.28,
    desktop: [4.7, 3.7, 6.5] as [number, number, number],
    mobile: [4, 4.5, 14] as [number, number, number],
    target: [0.5, -0.1, 0.7] as [number, number, number],
  },
  {
    mobileTarget: [-0.5, 0.2, 0] as [number, number, number],
    at: 0.5,
    desktop: [4, 2.6, 6.5] as [number, number, number],
    mobile: [3, 3.5, 13] as [number, number, number],
    target: [1.1, 0.4, 0.8] as [number, number, number],
  },
  {
    mobileTarget: [-0.5, 0.2, 0] as [number, number, number],
    at: 0.7,
    desktop: [6, 3.8, 8.5] as [number, number, number],
    mobile: [4, 4, 15] as [number, number, number],
    target: [0, 0.2, 0] as [number, number, number],
  },
  {
    mobileTarget: [-0.5, 0.2, 0] as [number, number, number],
    at: 1,
    desktop: [5.3, 2.6, 8.7] as [number, number, number],
    mobile: [4, 4, 15] as [number, number, number],
    target: [0, 0.5, 0] as [number, number, number],
  },
]

function Block({
  position,
  size,
  color,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function Label({
  children,
  position,
  small = false,
}: {
  children: React.ReactNode
  position: [number, number, number]
  small?: boolean
}) {
  const anchor = useRef<Group>(null)
  const label = useRef<HTMLDivElement>(null)
  useFrame(() => {
    let parent = anchor.current
    let visible = true
    while (parent) {
      if (!parent.visible) visible = false
      parent = parent.parent as Group | null
    }
    if (label.current) label.current.style.display = visible ? "block" : "none"
  })
  return (
    <group ref={anchor} position={position}>
      <Html center style={{ pointerEvents: "none", whiteSpace: "nowrap" }}>
        <div
          ref={label}
          style={{
            fontFamily: "Poppins, sans-serif",
            color: "#26463F",
            background: "rgba(250,253,252,.94)",
            border: "1px solid #D5E2DB",
            borderRadius: 4,
            padding: small ? "5px 9px" : "12px 18px",
            fontSize: small ? 11 : 15,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {children}
        </div>
      </Html>
    </group>
  )
}

export default function NaturalisScene(props: SceneProps) {
  const room = useRef<Group>(null)
  const plant = useRef<Group>(null)
  const paper = useRef<Group>(null)
  const devices = useRef<Group>(null)
  const leaves = useRef<Group>(null)
  const night = useRef<Group>(null)
  const result = useRef<Group>(null)
  const wall = useRef<MeshBasicMaterial>(null)
  const window = useRef<MeshBasicMaterial>(null)
  const low = props.quality === "low"
  useGreyboxRig(props, CREAM, frames)

  useFrame(() => {
    const p = props.progress.current
    const reveal = phase(p, 0.08, 0.2)
    const darkness = phase(p, 0.59, 0.68) * (1 - phase(p, 0.78, 0.9))
    if (room.current) {
      room.current.visible = p > 0.07
      room.current.scale.setScalar(0.92 + reveal * 0.08)
    }
    if (plant.current) plant.current.scale.y = 0.05 + phase(p, 0, 0.15) * 0.95
    if (paper.current) paper.current.visible = p >= 0.19 && p < 0.43
    if (devices.current) {
      devices.current.visible = p >= 0.38
      devices.current.position.y = -0.3 * (1 - phase(p, 0.38, 0.47))
    }
    if (leaves.current) {
      leaves.current.visible = p >= 0.42 && p < 0.62
      leaves.current.children.forEach((leaf, i) => {
        const travel = (phase(p, 0.42, 0.6) * 2 + i / 4) % 1
        leaf.position.set(
          -0.05 + travel * 2.1,
          0.7 + Math.sin(travel * Math.PI) * 0.65,
          1.5 - travel * 0.6
        )
      })
    }
    if (night.current) night.current.visible = p >= 0.6 && p < 0.82
    if (result.current) result.current.visible = p >= 0.82
    if (wall.current)
      wall.current.color
        .copy(DAY)
        .lerp(NIGHT, darkness * 0.85)
        .lerp(DAWN, phase(p, 0.8, 0.94) * 0.4)
    if (window.current) window.current.color.copy(DAWN).lerp(NIGHT, darkness)
  })

  return (
    <group>
      {/* An open architectural corner, rendered with unlit materials: no live shadows. */}
      <group ref={room}>
        <Block position={[0, -1.65, 0]} size={[7, 0.16, 5.5]} color="#DDE7DF" />
        <mesh position={[0, 0.3, -2.7]}>
          <boxGeometry args={[7, 4, 0.12]} />
          <meshBasicMaterial ref={wall} color={CREAM} />
        </mesh>
        <Block
          position={[-3.5, 0.3, -0.1]}
          size={[0.12, 4, 5.2]}
          color="#ECF2EB"
        />
        <mesh position={[-1.4, 0.55, -2.61]}>
          <planeGeometry args={[2.5, 2.8]} />
          <meshBasicMaterial ref={window} color="#F2EADD" />
        </mesh>
        <Block
          position={[-1.4, 2.02, -2.45]}
          size={[3, 0.06, 0.06]}
          color="#A5B9AC"
        />
        {Array.from({ length: low ? 6 : 12 }, (_, i) => (
          <Block
            key={i}
            position={[-2.75 + i * (low ? 0.14 : 0.07), 0.5, -2.35]}
            size={[low ? 0.14 : 0.08, 2.95, 0.08]}
            color={i % 2 ? "#DCE5D9" : "#F1F1E7"}
          />
        ))}
        {/* Camilla and an understated oval of baked-looking floor shade. */}
        <mesh
          position={[-0.9, -1.55, -0.2]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[1.5, 0.9, 1]}
        >
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial color="#C9D6C9" />
        </mesh>
        <Block
          position={[-0.8, -0.45, -0.1]}
          size={[2.6, 0.35, 1.2]}
          color="#F5F3E9"
        />
        <Block
          position={[-1.6, -0.18, -0.1]}
          size={[0.65, 0.17, 1.05]}
          color="#FFFFFF"
        />
        <Block
          position={[-0.1, -0.25, -0.1]}
          size={[0.7, 0.08, 1.24]}
          color="#81AAA4"
        />
        {[-1.7, 0.1].map((x) => (
          <Block
            key={x}
            position={[x, -1.1, -0.1]}
            size={[0.12, 0.95, 0.8]}
            color="#A6BAB0"
          />
        ))}
        {/* Desk anchors the paper agenda, then the connected devices. */}
        <Block
          position={[1.8, -0.35, 0.9]}
          size={[2.2, 0.13, 1.25]}
          color="#C5B49A"
        />
        {[1, 2.6].map((x) => (
          <Block
            key={x}
            position={[x, -1, 0.9]}
            size={[0.12, 1.25, 0.9]}
            color="#A2B0A1"
          />
        ))}
        <Label position={[-0.8, 1.8, -2.4]} small>
          naturalis · espacio para cuidar
        </Label>
      </group>

      <group position={[-2.75, -1.55, 0.9]}>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.32, 0.23, 0.55, low ? 6 : 12]} />
          <meshBasicMaterial color="#D6C3AA" />
        </mesh>
        <group ref={plant}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.025, 0.045, 1.8, 6]} />
            <meshBasicMaterial color={SAGE} />
          </mesh>
          {Array.from({ length: low ? 4 : 7 }, (_, i) => (
            <mesh
              key={i}
              position={[i % 2 ? -0.2 : 0.2, 0.8 + i * 0.19, 0]}
              rotation={[0.2, i * 0.8, i % 2 ? 0.7 : -0.7]}
              scale={[0.23, 0.47, 0.07]}
            >
              <sphereGeometry args={[1, 6, 4]} />
              <meshBasicMaterial color={i % 2 ? SAGE : "#81AAA4"} />
            </mesh>
          ))}
        </group>
      </group>

      <group ref={paper}>
        {[0, 1, 2].map((i) => (
          <group
            key={i}
            position={[1.2 + i * 0.4, -0.25 + i * 0.03, 0.85]}
            rotation={[0, i * 0.3 - 0.25, 0]}
          >
            <Block
              position={[0, 0, 0]}
              size={[0.65, 0.025, 0.9]}
              color="#FFFFFF"
            />
            {[0, 1, 2].map((row) => (
              <Block
                key={row}
                position={[0, 0.02, -0.25 + row * 0.22]}
                size={[0.45, 0.01, 0.025]}
                color={row === i ? "#BA8979" : "#A2B4AA"}
                rotation={[0, row === i ? 0.25 : 0, 0]}
              />
            ))}
          </group>
        ))}
        <Label position={[1.8, 0.9, 0.9]} small>
          Mensajes. Cambios. Cancelaciones.
        </Label>
      </group>

      <group ref={devices}>
        {/* Procedural kit stand-ins, awaiting T-A18. */}
        <group position={[0.3, 0.2, 1.5]} rotation={[-0.12, -0.2, 0]}>
          <Block
            position={[0, 0, 0]}
            size={[0.62, 1.16, 0.1]}
            color="#35524B"
          />
          <Block
            position={[0, 0, 0.06]}
            size={[0.53, 0.98, 0.012]}
            color="#F8FCF9"
          />
          {[0, 1, 2].map((i) => (
            <Block
              key={i}
              position={[0, 0.22 - i * 0.22, 0.075]}
              size={[0.4, 0.13, 0.01]}
              color={i === 1 ? "#81AAA4" : "#DDE8DF"}
            />
          ))}
          <Label position={[0, -0.85, 0]} small>
            Reservar un turno
          </Label>
        </group>
        <group position={[2, -0.2, 0.65]}>
          <Block
            position={[0, 0, 0.2]}
            size={[1.5, 0.05, 0.9]}
            color="#96AAA0"
          />
          <Block
            position={[0, 0.5, -0.2]}
            size={[1.5, 0.95, 0.07]}
            color="#35524B"
          />
          <Block
            position={[0, 0.5, -0.15]}
            size={[1.36, 0.81, 0.02]}
            color="#F8FCF9"
          />
          {[0, 1, 2, 3].map((i) => (
            <Block
              key={i}
              position={[-0.45 + i * 0.3, 0.5, -0.13]}
              size={[0.24, 0.6, 0.01]}
              color={i % 2 ? "#DDE8DF" : "#81AAA4"}
            />
          ))}
          <Label position={[0, 1.25, 0]} small>
            Natuadmin · agenda en orden
          </Label>
        </group>
      </group>
      <group ref={leaves}>
        {Array.from({ length: low ? 2 : 4 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, -0.8]} scale={[0.11, 0.19, 0.04]}>
            <sphereGeometry args={[1, 6, 4]} />
            <meshBasicMaterial color={SAGE} />
          </mesh>
        ))}
      </group>
      <group ref={night}>
        <Label position={[0.1, 1.45, 0.6]}>
          <strong>Mientras el equipo descansa</strong>
          <br />
          <span style={{ fontSize: 11 }}>
            Turnos fijos · confirmaciones · estadísticas
          </span>
        </Label>
        {[0, 1, 2, 3, 4].slice(0, low ? 3 : 5).map((i) => (
          <mesh key={i} position={[-1.5 + i * 0.7, 0.2 + (i % 2) * 0.4, 0.6]}>
            <sphereGeometry args={[0.055, 6, 4]} />
            <meshBasicMaterial color="#F6D59B" />
          </mesh>
        ))}
      </group>
      <group ref={result}>
        <Label position={[0, 1.35, 0.7]}>
          <strong style={{ fontSize: 21 }}>Orden sin esfuerzo.</strong>
          <br />
          <span style={{ fontSize: 12 }}>
            +650 clientes · +60 turnos por mes
          </span>
        </Label>
      </group>
    </group>
  )
}
