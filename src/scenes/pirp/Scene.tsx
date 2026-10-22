import { useMemo, useRef, useState } from "react"
import { Html, Line } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { Color, Group, InstancedMesh, Object3D } from "three"
import type { SceneProps } from "../../experience/types"
import { phase, useGreyboxRig } from "../greybox/runtime"
import { pirp } from "./definition"
import { emitInteract } from "@/guide/signals"

const cameras = [
  { at: 0, desktop: [0, 0, 9], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 0.3, desktop: [0.5, 0, 10], mobile: [0, 0, 12], target: [0, 0, 0] },
  { at: 0.5, desktop: [0, 0.4, 9], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 0.7, desktop: [0, 0, 9], mobile: [0, 0, 11], target: [0, 0, 0] },
  { at: 1, desktop: [0, 0, 8.5], mobile: [0, 0, 10], target: [0, 0, 0] },
] satisfies Parameters<typeof useGreyboxRig>[2]

const topics: [number, number, number][] = [
  [-1.6, 0.5, 0],
  [0, 1.1, 0],
  [1.6, -0.1, 0],
]
const sentiments = ["#6F9C88", "#EFE9DD", "#A8434F"]
const copy = [
  [
    "01 / SEÑAL",
    "Todo pasa rápido.",
    "Una señal toma el pulso de la conversación.",
  ],
  [
    "02 / RUIDO",
    "Demasiadas voces.",
    "Tocá una tarjeta para descubrir cómo se clasifica.",
  ],
  [
    "03 / CRITERIO",
    "El ruido encuentra orden.",
    "Los agentes agrupan las señales por tema y sentimiento.",
  ],
  [
    "04 / LECTURA",
    "El cambio se hace visible.",
    "Una variación de tendencia activa una alerta.",
  ],
  [
    "05 / ESTRATEGIA",
    "Ahora, una dirección.",
    "La lectura se convierte en una propuesta de acción.",
  ],
]
const cards = [
  {
    title: "Nuevo parque en Ciudad Aurora",
    topic: "Servicios",
    sentiment: "Positivo",
    color: "#6F9C88",
  },
  {
    title: "El transporte abre una conversación",
    topic: "Movilidad",
    sentiment: "Neutral",
    color: "#EFE9DD",
  },
  {
    title: "Vecinos piden claridad en los plazos",
    topic: "Gestión",
    sentiment: "Crítico",
    color: "#A8434F",
  },
]
const strategy =
  "Aclarar los plazos. Publicar avances verificables. Escuchar las preguntas de la comunidad."

/** Greybox: tarjetas geométricas instanciadas; atlas y capturas finales en T-A23. */
export default function PirpScene(props: SceneProps) {
  useGreyboxRig(props, pirp.palette.background, cameras)
  const stream = useRef<InstancedMesh>(null)
  const signal = useRef<Group>(null)
  const graph = useRef<Group>(null)
  const dashboard = useRef<Group>(null)
  const result = useRef<Group>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const caption = useRef<HTMLParagraphElement>(null)
  const cardPanel = useRef<HTMLDivElement>(null)
  const strategyText = useRef<HTMLParagraphElement>(null)
  const strategyPanel = useRef<HTMLDivElement>(null)
  const alert = useRef<HTMLDivElement>(null)
  const lastBeat = useRef(-1)
  const [selected, setSelected] = useState<number | null>(null)
  const count = props.quality === "low" || props.isMobile ? 36 : 84
  const dummyRef = useRef(new Object3D())
  const colorRef = useRef(new Color())
  const trend = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i): [number, number, number] => [
        -2.3 + i * 0.17,
        -0.65 + i * 0.035 + Math.sin(i * 0.65) * 0.14 + (i === 20 ? 0.8 : 0),
        0.1,
      ]),
    []
  )

  useFrame(() => {
    const dummy = dummyRef.current
    const color = colorRef.current
    const p = props.progress.current
    const beat = Math.min(4, Math.floor(p * 5))
    if (lastBeat.current !== beat) {
      lastBeat.current = beat
      if (heading.current) heading.current.textContent = copy[beat][1]
      if (caption.current) caption.current.textContent = copy[beat][2]
    }
    if (signal.current) {
      signal.current.visible = p < 0.23
      signal.current.scale.setScalar(0.8 + Math.sin(p * 65) * 0.08)
    }
    if (graph.current) graph.current.visible = p >= 0.39 && p < 0.61
    if (dashboard.current) dashboard.current.visible = p >= 0.6 && p < 0.81
    if (result.current) result.current.visible = p >= 0.8
    if (cardPanel.current)
      cardPanel.current.style.display =
        p >= 0.2 && p < 0.6 && props.active ? "block" : "none"
    if (strategyPanel.current)
      strategyPanel.current.style.display = p >= 0.8 ? "block" : "none"
    if (strategyText.current)
      strategyText.current.textContent = strategy.slice(
        0,
        Math.floor(phase(p, 0.81, 0.98) * strategy.length)
      )
    if (alert.current)
      alert.current.style.display = p >= 0.7 && p < 0.81 ? "block" : "none"
    if (stream.current) {
      stream.current.visible = p >= 0.17 && p < 0.61
      const organized = phase(p, 0.38, 0.56)
      for (let i = 0; i < count; i++) {
        const topic = i % 3
        const t = (i * 0.618033 + p * 4) % 1
        const x = props.isMobile ? Math.sin(i * 2.3) * 1.7 : (t - 0.5) * 13
        const y = props.isMobile ? (t - 0.5) * 12 : Math.sin(i * 2.3) * 2.1
        const target = topics[topic]
        dummy.position.set(
          x * (1 - organized) +
            (target[0] + Math.cos(i * 2.4) * 0.45) * organized,
          y * (1 - organized) +
            (target[1] + Math.sin(i * 2.4) * 0.4) * organized,
          -0.8 - (i % 4) * 0.15
        )
        dummy.rotation.z = (1 - organized) * Math.sin(i) * 0.22
        dummy.scale.set(0.72 - organized * 0.42, 0.34 - organized * 0.19, 0.025)
        dummy.updateMatrix()
        stream.current.setMatrixAt(i, dummy.matrix)
        stream.current.setColorAt(
          i,
          color.set(
            organized > 0.1
              ? sentiments[topic]
              : i % 7 === 0
                ? "#EFE9DD"
                : "#434346"
          )
        )
      }
      stream.current.instanceMatrix.needsUpdate = true
      if (stream.current.instanceColor)
        stream.current.instanceColor.needsUpdate = true
    }
  })

  const selectCard = (index: number) => {
    if (!props.active) return
    setSelected(index)
    emitInteract(`pirp:card:${index}`)
  }
  const panelWidth = props.isMobile ? 270 : 430
  return (
    <group>
      <Html
        className="pirp-scene-copy"
        center
        position={[0, 2.9, 0]}
        style={{
          display: props.active ? "block" : "none",
          width: panelWidth,
          pointerEvents: "none",
          color: "#EFE9DD",
          textAlign: "center",
          fontFamily: "Poppins, sans-serif",
          background: "#17181Af0",
          padding: 12,
        }}
      >
        <h2
          ref={heading}
          style={{
            margin: "9px 0",
            fontSize: props.isMobile ? 23 : 34,
            lineHeight: 1.1,
            fontWeight: 600,
          }}
        >
          {copy[0][1]}
        </h2>
        <p ref={caption} style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
          {copy[0][2]}
        </p>
      </Html>

      <group ref={signal}>
        <mesh>
          <torusGeometry args={[1, 0.018, 8, 64]} />
          <meshBasicMaterial color="#A8434F" />
        </mesh>
        <mesh scale={1.35}>
          <torusGeometry args={[1, 0.006, 6, 64]} />
          <meshBasicMaterial color="#795056" />
        </mesh>
        <Line
          points={[
            [-3, 0, 0],
            [-0.6, 0, 0],
            [-0.2, 0.5, 0],
            [0, -0.6, 0],
            [0.3, 0.18, 0],
            [0.5, 0, 0],
            [3, 0, 0],
          ]}
          color="#EFE9DD"
          lineWidth={2}
        />
      </group>
      <instancedMesh
        ref={stream}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        onClick={(event) => {
          if (!props.active || event.instanceId === undefined) return
          event.stopPropagation()
          selectCard(event.instanceId % cards.length)
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </instancedMesh>

      <group ref={graph} visible={false}>
        <Line
          points={[topics[0], topics[1], topics[2], topics[0]]}
          color="#A8434F"
          lineWidth={1.5}
        />
        {topics.map((position, i) => (
          <mesh key={i} position={position}>
            <sphereGeometry args={[0.13, 12, 8]} />
            <meshBasicMaterial color={sentiments[i]} />
          </mesh>
        ))}
      </group>

      <group ref={dashboard} visible={false} scale={props.isMobile ? 0.75 : 1}>
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[5.3, 2.4, 0.12]} />
          <meshBasicMaterial color="#242425" />
        </mesh>
        {[-0.8, 0, 0.8].map((y) => (
          <Line
            key={y}
            points={[
              [-2.4, y, 0],
              [2.4, y, 0],
            ]}
            color="#414144"
            lineWidth={0.5}
          />
        ))}
        <Line points={trend} color="#6F9C88" lineWidth={3} />
        <mesh position={[1.1, 0.85, 0.1]}>
          <ringGeometry args={[0.12, 0.16, 24]} />
          <meshBasicMaterial color="#CF6975" />
        </mesh>
        <mesh position={[-2.1, 0, 0.2]}>
          <boxGeometry args={[0.1, 1.6, 0.04]} />
          <meshBasicMaterial color="#6F9C88" />
        </mesh>
      </group>
      <Html
        center
        position={[0, -1.7, 0]}
        style={{
          pointerEvents: "none",
          display: props.active ? "block" : "none",
          width: panelWidth,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div
          ref={alert}
          style={{
            display: "none",
            background: "#7A1F2B",
            color: "#EFE9DD",
            padding: "12px 16px",
            fontSize: 12,
          }}
        >
          ↗ Alerta de demo · crecen las consultas sobre plazos
        </div>
      </Html>

      <group ref={result} visible={false}>
        <Line
          points={[
            [-2.5, 0.3, 0],
            [-1, 0.3, 0],
            [0, 0.35, 0],
            [1, 0.3, 0],
            [2.5, 0.3, 0],
          ]}
          color="#A8434F"
          lineWidth={2}
        />
      </group>
      <Html
        center
        position={[0, -0.4, 0.3]}
        style={{
          display: props.active ? "block" : "none",
          width: panelWidth,
          pointerEvents: "none",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div
          ref={strategyPanel}
          style={{
            display: "none",
            padding: 22,
            background: "#242425",
            borderLeft: "3px solid #A8434F",
            color: "#EFE9DD",
          }}
        >
          <span
            style={{ fontSize: 10, letterSpacing: "0.15em", color: "#CE8990" }}
          >
            PROPUESTA · DEMO FICTICIA
          </span>
          <p
            ref={strategyText}
            style={{
              minHeight: 84,
              fontSize: 18,
              lineHeight: 1.5,
              marginBottom: 0,
            }}
          />
        </div>
      </Html>

      <Html
        center
        position={[0, -1.65, 1]}
        style={{
          display: props.active ? "block" : "none",
          width: panelWidth,
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <div ref={cardPanel} style={{ display: "none", color: "#EFE9DD" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {cards.map((card, i) => (
              <button
                key={card.topic}
                type="button"
                aria-pressed={selected === i}
                onClick={() => selectCard(i)}
                style={{
                  flex: 1,
                  cursor: "pointer",
                  minHeight: 68,
                  padding: "10px 8px",
                  background: selected === i ? "#7A1F2B" : "#242425",
                  border: "1px solid #A8434F",
                  borderRadius: 4,
                  color: "#EFE9DD",
                  fontFamily: "inherit",
                  fontSize: 11,
                  lineHeight: 1.4,
                }}
              >
                {card.title}
              </button>
            ))}
          </div>
          <p
            role="status"
            aria-live="polite"
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              minHeight: 18,
              textAlign: "center",
              color: selected === null ? "#EFE9DD" : cards[selected].color,
            }}
          >
            {selected === null
              ? "Tocá un titular ficticio para clasificarlo"
              : `${cards[selected].topic} · ${cards[selected].sentiment} · Clasificación de demo`}
          </p>
        </div>
      </Html>
      <Html
        center
        position={[0, -3, 0]}
        style={{
          display: props.active ? "block" : "none",
          width: panelWidth,
          pointerEvents: "none",
          textAlign: "center",
          color: "#B3ACA5",
          fontFamily: "Poppins, sans-serif",
          fontSize: 9,
          letterSpacing: "0.08em",
        }}
      >
        Titulares, datos y estrategia ficticios
      </Html>
    </group>
  )
}
