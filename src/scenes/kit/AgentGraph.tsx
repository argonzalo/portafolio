import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import {
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  RingGeometry,
  SphereGeometry,
  Vector3,
} from "three"
import type { QualityTier } from "@/experience/types"
import { emitInteract } from "@/guide/signals"
import { beatEnvelope, phase, type Vec3Tuple } from "./cameraRig"
import { KitHtml } from "./KitHtml"
import { KIT_THEMES, type KitTheme } from "./theme"
import { ThreadLine } from "./ThreadLine"

export type AgentNodeDef = {
  id: string
  /** Nombre corto del nodo o agente (ej. "Detección", "Calibración"). */
  label: string
  /** Decisión o salida visible cuando el nodo se enciende (ej. "bbox + pose 17p"). */
  decision: string
  /** Métrica secundaria opcional (ej. "4.2 ms", "98.4%"). */
  metric?: string
  /** Posición precalculada en desktop [x, y, z]. */
  desktop: Vec3Tuple
  /** Posición precalculada en mobile (si se omite, se genera en tira vertical). */
  mobile?: Vec3Tuple
  /** Instante de progreso (0..1) en el que el nodo se enciende y toma su decisión. */
  triggerAt: number
}

export type AgentEdgeDef = {
  id?: string
  from: string
  to: string
  /** Curvatura vertical/profundidad del arco entre nodos. */
  arcHeight?: number
  /** Ventana de progreso `[start, end]` en la que la arista se dibuja y transporta pulsos. */
  range?: [number, number]
}

export type AgentGraphProps = {
  nodes: readonly AgentNodeDef[]
  edges: readonly AgentEdgeDef[]
  progress: { readonly current: number }
  quality: QualityTier
  isMobile: boolean
  active?: boolean
  theme?: KitTheme
  /** Ventana de progreso `[enterStart, enterEnd, exitStart, exitEnd]` donde el grafo es visible. */
  range?: [number, number, number, number]
  /** Si es `true`, permite tocar un nodo para inspeccionar su decisión. */
  interactive?: boolean
  onSelectNode?: (nodeId: string) => void
}

function resolveNodePosition(
  node: AgentNodeDef,
  index: number,
  total: number,
  isMobile: boolean
): Vec3Tuple {
  if (!isMobile) return node.desktop
  if (node.mobile) return node.mobile
  const span = 3.4
  const y = 1.75 - (index / Math.max(1, total - 1)) * span
  const x = index % 2 === 0 ? -0.32 : 0.32
  return [x, y, 0]
}

function buildEdgeControlPoints(
  from: Vec3Tuple,
  to: Vec3Tuple,
  arcHeight = 0.28
): Vec3Tuple[] {
  const mid: Vec3Tuple = [
    (from[0] + to[0]) * 0.5,
    (from[1] + to[1]) * 0.5 + arcHeight,
    (from[2] + to[2]) * 0.5 + arcHeight * 0.35,
  ]
  return [from, mid, to]
}

/**
 * Grafo de nodos / agentes con layout precalculado, aristas del shader del hilo
 * y etiquetas de decisión proyectadas en DOM (`03` §2).
 */
export function AgentGraph({
  nodes,
  edges,
  progress,
  quality,
  isMobile,
  active = true,
  theme = KIT_THEMES.vibo,
  range = [0, 0.04, 0.96, 1],
  interactive = false,
  onSelectNode,
}: AgentGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const groupRef = useRef<Group>(null)
  const domRootRef = useRef<HTMLDivElement>(null)

  const coreRefs = useRef<(Mesh | null)[]>([])
  const ringRefs = useRef<(Mesh | null)[]>([])
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([])
  const statusDotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const decisionRefs = useRef<(HTMLSpanElement | null)[]>([])

  const scratch = useRef(new Vector3())
  const activeColor = useMemo(() => new Color(theme.accent), [theme.accent])
  const primaryColor = useMemo(() => new Color(theme.primary), [theme.primary])
  const idleColor = useMemo(
    () => new Color(theme.gridColor),
    [theme.gridColor]
  )

  const sphereGeo = useMemo(
    () => new SphereGeometry(0.11, quality === "low" ? 8 : 16, 12),
    [quality]
  )
  const ringGeo = useMemo(
    () => new RingGeometry(0.16, 0.22, quality === "low" ? 12 : 24),
    [quality]
  )
  const diamondGeo = useMemo(() => new OctahedronGeometry(0.14, 0), [])

  const coreMaterials = useMemo(
    () =>
      nodes.map(
        () =>
          new MeshBasicMaterial({
            color: theme.gridColor,
            transparent: true,
            opacity: 0.95,
          })
      ),
    [nodes, theme.gridColor]
  )

  const ringMaterials = useMemo(
    () =>
      nodes.map(
        () =>
          new MeshBasicMaterial({
            color: theme.primary,
            side: DoubleSide,
            transparent: true,
            opacity: 0.5,
          })
      ),
    [nodes, theme.primary]
  )

  useEffect(() => () => sphereGeo.dispose(), [sphereGeo])
  useEffect(() => () => ringGeo.dispose(), [ringGeo])
  useEffect(() => () => diamondGeo.dispose(), [diamondGeo])
  useEffect(
    () => () => {
      coreMaterials.forEach((m) => m.dispose())
      ringMaterials.forEach((m) => m.dispose())
    },
    [coreMaterials, ringMaterials]
  )

  const nodePositions = useMemo(() => {
    const map = new Map<string, Vec3Tuple>()
    nodes.forEach((node, idx) => {
      map.set(
        node.id,
        resolveNodePosition(node, idx, nodes.length, isMobile)
      )
    })
    return map
  }, [nodes, isMobile])

  useFrame(({ camera, size }, delta) => {
    const p = progress.current
    const envelope = active
      ? beatEnvelope(p, range[0], range[1], range[2], range[3])
      : 0

    if (groupRef.current) {
      groupRef.current.visible = envelope > 0.01
    }
    if (domRootRef.current) {
      domRootRef.current.style.opacity = envelope.toFixed(3)
      domRootRef.current.style.visibility =
        envelope > 0.01 ? "visible" : "hidden"
    }
    if (envelope <= 0.01) return

    const width = size.width
    const height = size.height

    nodes.forEach((node, idx) => {
      const pos = nodePositions.get(node.id) ?? node.desktop
      const activation = phase(p, node.triggerAt - 0.04, node.triggerAt + 0.03)
      const isDecided = activation > 0.65

      const core = coreRefs.current[idx]
      const ring = ringRefs.current[idx]
      const coreMat = coreMaterials[idx]
      const ringMat = ringMaterials[idx]

      if (core && coreMat) {
        core.position.set(pos[0], pos[1], pos[2])
        const scale = 0.85 + activation * 0.35
        core.scale.setScalar(scale)
        coreMat.color
          .copy(idleColor)
          .lerp(primaryColor, Math.min(1, activation * 1.4))
          .lerp(activeColor, Math.max(0, (activation - 0.5) * 2))
        coreMat.opacity = envelope
      }

      if (ring && ringMat) {
        ring.position.set(pos[0], pos[1], pos[2])
        ring.rotation.z += delta * (0.4 + activation * 1.4)
        ring.scale.setScalar(0.75 + activation * 0.5)
        ringMat.color.copy(isDecided ? activeColor : primaryColor)
        ringMat.opacity = envelope * (0.22 + activation * 0.68)
      }

      const badge = badgeRefs.current[idx]
      if (!badge) return

      scratch.current.set(pos[0], pos[1], pos[2]).project(camera)
      const inFront = scratch.current.z >= -1 && scratch.current.z <= 1
      if (!inFront) {
        badge.style.opacity = "0"
        badge.style.visibility = "hidden"
        return
      }

      const sx = (scratch.current.x * 0.5 + 0.5) * width
      const sy = (-scratch.current.y * 0.5 + 0.5) * height

      const offsetX = isMobile ? (idx % 2 === 0 ? 18 : -168) : -74
      const offsetY = isMobile ? -20 : idx % 2 === 0 ? 22 : -68
      const clampedX = MathUtils.clamp(sx + offsetX, 12, width - 168)
      const clampedY = MathUtils.clamp(sy + offsetY, 54, height - 84)

      badge.style.visibility = "visible"
      badge.style.opacity = (envelope * (0.45 + activation * 0.55)).toFixed(3)
      badge.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0)`
      badge.style.borderColor = isDecided ? theme.borderStrong : theme.border

      const dot = statusDotRefs.current[idx]
      if (dot) {
        dot.style.background = isDecided ? theme.accent : theme.textMuted
        dot.style.boxShadow = isDecided ? `0 0 8px ${theme.accent}` : "none"
      }

      const dec = decisionRefs.current[idx]
      if (dec) {
        dec.style.color = isDecided ? theme.accent : theme.textMuted
      }
    })
  })

  const handleNodeClick = (nodeId: string) => {
    if (!active || !interactive) return
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId))
    onSelectNode?.(nodeId)
    emitInteract(`kit:graph:node:${nodeId}`)
  }

  return (
    <group ref={groupRef}>
      {/* Aristas con el shader del hilo conductor */}
      {edges.map((edge, idx) => {
        const fromPos = nodePositions.get(edge.from)
        const toPos = nodePositions.get(edge.to)
        if (!fromPos || !toPos) return null

        const fromNode = nodes.find((n) => n.id === edge.from)
        const toNode = nodes.find((n) => n.id === edge.to)
        const drawStart = edge.range?.[0] ?? (fromNode?.triggerAt ?? 0.25)
        const drawEnd =
          edge.range?.[1] ??
          Math.max(drawStart + 0.06, toNode?.triggerAt ?? drawStart + 0.08)

        const controlPts = buildEdgeControlPoints(
          fromPos,
          toPos,
          isMobile ? (edge.arcHeight ?? 0.16) * 0.5 : (edge.arcHeight ?? 0.28)
        )

        return (
          <ThreadLine
            key={edge.id ?? `${edge.from}-${edge.to}-${idx}`}
            points={controlPts}
            progress={progress}
            quality={quality}
            color={theme.primary}
            headColor={theme.accent}
            width={isMobile ? 0.026 : 0.032}
            draw={[drawStart, drawEnd]}
            opacity={(p) =>
              beatEnvelope(p, range[0], range[1], range[2], range[3])
            }
            pulseSpeed={0.85}
            pulseTail={0.14}
            showHead={quality !== "low"}
            headSize={18}
            scheme={theme.scheme}
          />
        )
      })}

      {/* Nodos 3D (núcleo + anillo de decisión) */}
      {nodes.map((node, idx) => (
        <group key={node.id}>
          <mesh
            ref={(el) => {
              coreRefs.current[idx] = el
            }}
            geometry={idx === nodes.length - 1 ? diamondGeo : sphereGeo}
            material={coreMaterials[idx]}
          />
          <mesh
            ref={(el) => {
              ringRefs.current[idx] = el
            }}
            geometry={ringGeo}
            material={ringMaterials[idx]}
          />
        </group>
      ))}

      {/* Tarjetas de decisión proyectadas en DOM */}
      <KitHtml>
        <div
          ref={domRootRef}
          className="pointer-events-none absolute inset-0 overflow-hidden select-none"
          style={{ fontFamily: "Poppins, sans-serif" }}
          data-kit-graph={theme.id}
        >
          {nodes.map((node, idx) => {
            const isSelected = selectedNodeId === node.id
            return (
              <div
                key={node.id}
                ref={(el) => {
                  badgeRefs.current[idx] = el
                }}
                onClick={
                  interactive ? () => handleNodeClick(node.id) : undefined
                }
                role={interactive ? "button" : undefined}
                tabIndex={interactive ? 0 : undefined}
                aria-pressed={interactive ? isSelected : undefined}
                onKeyDown={
                  interactive
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleNodeClick(node.id)
                        }
                      }
                    : undefined
                }
                className={`absolute top-0 left-0 w-[152px] rounded-md px-2.5 py-1.5 backdrop-blur-md ${
                  interactive
                    ? "pointer-events-auto min-h-11 cursor-pointer"
                    : "pointer-events-none"
                }`}
                style={{
                  opacity: 0,
                  visibility: "hidden",
                  background: isSelected
                    ? theme.surfaceElevated
                    : theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.24)",
                }}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-tight">
                    <span
                      ref={(el) => {
                        statusDotRefs.current[idx] = el
                      }}
                      className="inline-block h-2 w-2 shrink-0 rounded-full"
                      style={{ background: theme.textMuted }}
                    />
                    {node.label}
                  </span>
                  <span
                    className="font-mono text-[9px]"
                    style={{
                      color: theme.textMuted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {node.metric ?? `0${idx + 1}`}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[10px]">
                  <span
                    ref={(el) => {
                      decisionRefs.current[idx] = el
                    }}
                    style={{ color: theme.textMuted }}
                  >
                    {node.decision}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </KitHtml>
    </group>
  )
}
