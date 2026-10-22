import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { MathUtils, Vector3, type Camera } from "three"
import { emitInteract } from "@/guide/signals"
import { beatEnvelope, type Vec3Tuple } from "./cameraRig"
import { KitHtml } from "./KitHtml"
import { KIT_THEMES, type KitTheme } from "./theme"

export type DynamicVec3 = Vec3Tuple | ((progress: number) => Vec3Tuple)

export type HudMarkerItem = {
  id: string
  /** Coordenada 3D de anclaje en el mundo. */
  position: DynamicVec3
  /** Desplazamiento en píxeles de la tarjeta respecto al pin proyectado [dx, dy]. */
  offset?: [number, number]
  /** Código corto de telemetría (ej. `TRK-02` o `IMPACTO`). */
  code?: string
  /** Etiqueta descriptiva legible. */
  label: string
  /** Valor estático o calculado por frame (escrito en `textContent` sin re-render). */
  value: string | ((progress: number) => string)
  /** Unidad o nota lateral (ej. `km/h`, `ms`, `CONF`). */
  unit?: string
  /** Ventana de progreso `[enterStart, enterEnd, exitStart, exitEnd]` o `[start, end]`. */
  range?: [number, number] | [number, number, number, number]
  /** Tono cromático dentro del tema. */
  tone?: "primary" | "accent" | "positive" | "danger"
}

export type HudBoundingBox3D = {
  id: string
  center: DynamicVec3
  size: [width: number, height: number, depth: number]
  label: string
  tag?: string
  confidence?: number | ((progress: number) => number)
  footerMetrics?: { label: string; value: string }[]
  range?: [number, number] | [number, number, number, number]
}

export type HudJoint3D = {
  id: string
  position: DynamicVec3
  accent?: boolean
}

export type HudAngleGauge3D = {
  vertexId: string
  armAId: string
  armBId: string
  label: string
  degrees: number | ((progress: number) => number)
}

export type HudPoseSkeleton3D = {
  id: string
  joints: readonly HudJoint3D[]
  bones: readonly [fromId: string, toId: string][]
  angleGauge?: HudAngleGauge3D
  range?: [number, number] | [number, number, number, number]
}

export type HudOverlayProps = {
  progress: { readonly current: number }
  isMobile: boolean
  active?: boolean
  theme?: KitTheme
  markers?: readonly HudMarkerItem[]
  boxes?: readonly HudBoundingBox3D[]
  skeleton?: HudPoseSkeleton3D
  /** ID de marcador resaltado inicialmente. */
  defaultSelectedId?: string
  onSelectMarker?: (id: string) => void
}

function resolveRangeAlpha(
  progress: number,
  range?: [number, number] | [number, number, number, number]
): number {
  if (!range) return 1
  if (range.length === 2) {
    const [start, end] = range
    const feather = Math.min(0.04, (end - start) * 0.22)
    return beatEnvelope(
      progress,
      start,
      start + feather,
      end - feather,
      end
    )
  }
  return beatEnvelope(progress, range[0], range[1], range[2], range[3])
}

function resolveVec3(input: DynamicVec3, progress: number): Vec3Tuple {
  return typeof input === "function" ? input(progress) : input
}

function projectToScreen(
  world: Vec3Tuple,
  camera: Camera,
  width: number,
  height: number,
  scratch: Vector3
): { x: number; y: number; visible: boolean } {
  scratch.set(world[0], world[1], world[2]).project(camera)
  const visible =
    scratch.z >= -1 &&
    scratch.z <= 1 &&
    Math.abs(scratch.x) <= 1.25 &&
    Math.abs(scratch.y) <= 1.25
  return {
    x: (scratch.x * 0.5 + 0.5) * width,
    y: (-scratch.y * 0.5 + 0.5) * height,
    visible,
  }
}

function toneColor(
  theme: KitTheme,
  tone: HudMarkerItem["tone"] = "primary"
): string {
  switch (tone) {
    case "accent":
      return theme.accent
    case "positive":
      return theme.positive
    case "danger":
      return theme.danger
    default:
      return theme.primary
  }
}

/**
 * Capa de HUD anclada a coordenadas 3D reales y renderizada en DOM/SVG nítido (`01` §2, `03` §2).
 *
 * - Cero `setState` por frame: proyecta coordenadas 3D en `useFrame` y actualiza
 *   `style.transform`, atributos SVG y `textContent` de forma directa.
 * - En mobile (`02` §4): muestra los pines táctiles (≥ 44×44 px) y despliega una
 *   sola tarjeta activa a la vez al hacer tap.
 */
export function HudOverlay({
  progress,
  isMobile,
  active = true,
  theme = KIT_THEMES.vibo,
  markers = [],
  boxes = [],
  skeleton,
  defaultSelectedId,
  onSelectMarker,
}: HudOverlayProps) {
  const [selectedId, setSelectedId] = useState<string>(
    () => defaultSelectedId ?? markers[0]?.id ?? boxes[0]?.id ?? ""
  )
  const [highlightedBoxId, setHighlightedBoxId] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const markerAnchorRefs = useRef<(HTMLDivElement | null)[]>([])
  const markerCardRefs = useRef<(HTMLDivElement | null)[]>([])
  const markerValueRefs = useRef<(HTMLSpanElement | null)[]>([])
  const markerLineRefs = useRef<(SVGPolylineElement | null)[]>([])

  const boxRefs = useRef<(HTMLDivElement | null)[]>([])
  const boxConfRefs = useRef<(HTMLSpanElement | null)[]>([])

  const boneRefs = useRef<(SVGLineElement | null)[]>([])
  const jointRefs = useRef<(SVGCircleElement | null)[]>([])
  const angleGroupRef = useRef<SVGGElement>(null)
  const angleArcRef = useRef<SVGPathElement>(null)
  const angleTextRef = useRef<HTMLSpanElement>(null)
  const angleTagRef = useRef<HTMLDivElement>(null)

  const scratch = useRef(new Vector3())
  const cornerScratch = useRef(new Vector3())

  const handleSelectMarker = (id: string) => {
    if (!active) return
    setSelectedId(id)
    onSelectMarker?.(id)
    emitInteract(`kit:hud:marker:${id}`)
  }

  const handleToggleBox = (id: string) => {
    if (!active) return
    setHighlightedBoxId((prev) => (prev === id ? null : id))
    emitInteract(`kit:hud:box:${id}`)
  }

  useFrame(({ camera, size }) => {
    const root = rootRef.current
    if (!root) return

    if (!active) {
      root.style.opacity = "0"
      root.style.visibility = "hidden"
      return
    }
    root.style.opacity = "1"
    root.style.visibility = "visible"

    const p = progress.current
    const width = size.width
    const height = size.height

    // 1. Proyección de Bounding Boxes 3D (8 esquinas proyectadas al rectángulo 2D envolvente)
    boxes.forEach((box, idx) => {
      const boxEl = boxRefs.current[idx]
      if (!boxEl) return

      const alpha = resolveRangeAlpha(p, box.range)
      if (alpha <= 0.01) {
        boxEl.style.opacity = "0"
        boxEl.style.visibility = "hidden"
        return
      }

      const center = resolveVec3(box.center, p)
      const [hx, hy, hz] = [
        box.size[0] * 0.5,
        box.size[1] * 0.5,
        box.size[2] * 0.5,
      ]

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      let anyVisible = false

      for (const sx of [-1, 1]) {
        for (const sy of [-1, 1]) {
          for (const sz of [-1, 1]) {
            const pt = projectToScreen(
              [center[0] + sx * hx, center[1] + sy * hy, center[2] + sz * hz],
              camera,
              width,
              height,
              cornerScratch.current
            )
            if (pt.visible) anyVisible = true
            minX = Math.min(minX, pt.x)
            minY = Math.min(minY, pt.y)
            maxX = Math.max(maxX, pt.x)
            maxY = Math.max(maxY, pt.y)
          }
        }
      }

      if (!anyVisible) {
        boxEl.style.opacity = "0"
        boxEl.style.visibility = "hidden"
        return
      }

      const clampedX = MathUtils.clamp(minX, 12, width - 80)
      const clampedY = MathUtils.clamp(minY, 56, height - 80)
      const boxW = MathUtils.clamp(maxX - minX, 92, width * 0.72)
      const boxH = MathUtils.clamp(maxY - minY, 110, height * 0.74)

      boxEl.style.visibility = "visible"
      boxEl.style.opacity = alpha.toFixed(3)
      boxEl.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0)`
      boxEl.style.width = `${boxW.toFixed(1)}px`
      boxEl.style.height = `${boxH.toFixed(1)}px`

      const confEl = boxConfRefs.current[idx]
      if (confEl && box.confidence !== undefined) {
        const confVal =
          typeof box.confidence === "function"
            ? box.confidence(p)
            : box.confidence
        confEl.textContent = `${Math.round(confVal * 100)}% CONF`
      }
    })

    // 2. Proyección de Esqueleto de Pose (Keypoints + Huesos + Arco de Ángulo)
    if (skeleton) {
      const skelAlpha = resolveRangeAlpha(p, skeleton.range)
      const jointCoords = new Map<
        string,
        { x: number; y: number; visible: boolean }
      >()

      skeleton.joints.forEach((joint, idx) => {
        const pos = resolveVec3(joint.position, p)
        const projected = projectToScreen(
          pos,
          camera,
          width,
          height,
          scratch.current
        )
        jointCoords.set(joint.id, projected)

        const circle = jointRefs.current[idx]
        if (circle) {
          if (skelAlpha <= 0.01 || !projected.visible) {
            circle.setAttribute("opacity", "0")
          } else {
            circle.setAttribute("cx", projected.x.toFixed(1))
            circle.setAttribute("cy", projected.y.toFixed(1))
            circle.setAttribute("opacity", skelAlpha.toFixed(3))
          }
        }
      })

      skeleton.bones.forEach(([fromId, toId], idx) => {
        const line = boneRefs.current[idx]
        if (!line) return
        const a = jointCoords.get(fromId)
        const b = jointCoords.get(toId)
        if (!a || !b || !a.visible || !b.visible || skelAlpha <= 0.01) {
          line.setAttribute("opacity", "0")
          return
        }
        line.setAttribute("x1", a.x.toFixed(1))
        line.setAttribute("y1", a.y.toFixed(1))
        line.setAttribute("x2", b.x.toFixed(1))
        line.setAttribute("y2", b.y.toFixed(1))
        line.setAttribute("opacity", (skelAlpha * 0.9).toFixed(3))
      })

      if (skeleton.angleGauge) {
        const { vertexId, armAId, armBId, degrees } = skeleton.angleGauge
        const v = jointCoords.get(vertexId)
        const a = jointCoords.get(armAId)
        const b = jointCoords.get(armBId)

        if (
          v &&
          a &&
          b &&
          v.visible &&
          skelAlpha > 0.02 &&
          angleGroupRef.current &&
          angleArcRef.current
        ) {
          const angA = Math.atan2(a.y - v.y, a.x - v.x)
          const angB = Math.atan2(b.y - v.y, b.x - v.x)
          const radius = isMobile ? 20 : 26
          const startX = v.x + Math.cos(angA) * radius
          const startY = v.y + Math.sin(angA) * radius
          const endX = v.x + Math.cos(angB) * radius
          const endY = v.y + Math.sin(angB) * radius

          angleGroupRef.current.setAttribute("opacity", skelAlpha.toFixed(3))
          angleArcRef.current.setAttribute(
            "d",
            `M ${ v.x.toFixed(1) } ${ v.y.toFixed(1) } L ${ startX.toFixed(1) } ${ startY.toFixed(1) } A ${ radius } ${ radius } 0 0 1 ${ endX.toFixed(1) } ${ endY.toFixed(1) } Z`
          )

          if (angleTagRef.current) {
            angleTagRef.current.style.visibility = "visible"
            angleTagRef.current.style.opacity = skelAlpha.toFixed(3)
            angleTagRef.current.style.transform = `translate3d(${(v.x + 16).toFixed(1)}px, ${(v.y - 26).toFixed(1)}px, 0)`
          }
          if (angleTextRef.current) {
            const deg = typeof degrees === "function" ? degrees(p) : degrees
            angleTextRef.current.textContent = `${deg.toFixed(1)}°`
          }
        } else {
          angleGroupRef.current?.setAttribute("opacity", "0")
          if (angleTagRef.current) {
            angleTagRef.current.style.opacity = "0"
            angleTagRef.current.style.visibility = "hidden"
          }
        }
      }
    }

    // 3. Proyección de Marcadores / Callouts con líneas guía
    markers.forEach((marker, idx) => {
      const anchorEl = markerAnchorRefs.current[idx]
      const cardEl = markerCardRefs.current[idx]
      const lineEl = markerLineRefs.current[idx]
      const valEl = markerValueRefs.current[idx]

      const alpha = resolveRangeAlpha(p, marker.range)
      const worldPos = resolveVec3(marker.position, p)
      const projected = projectToScreen(
        worldPos,
        camera,
        width,
        height,
        scratch.current
      )

      if (!projected.visible || alpha <= 0.01) {
        if (anchorEl) {
          anchorEl.style.opacity = "0"
          anchorEl.style.visibility = "hidden"
        }
        if (cardEl) {
          cardEl.style.opacity = "0"
          cardEl.style.visibility = "hidden"
        }
        if (lineEl) {
          lineEl.setAttribute("opacity", "0")
        }
        return
      }

      if (anchorEl) {
        anchorEl.style.visibility = "visible"
        anchorEl.style.opacity = alpha.toFixed(3)
        anchorEl.style.transform = `translate3d(${projected.x.toFixed(1)}px, ${projected.y.toFixed(1)}px, 0)`
      }

      if (valEl) {
        valEl.textContent =
          typeof marker.value === "function" ? marker.value(p) : marker.value
      }

      const isSelected = selectedId === marker.id
      // En mobile solo se despliega la tarjeta del marcador seleccionado (`02` §4).
      const showCard = !isMobile || isSelected

      const [ox, oy] = marker.offset ?? [58, -42]
      const cardX = isMobile
        ? MathUtils.clamp(projected.x + ox * 0.45, 16, width - 210)
        : MathUtils.clamp(projected.x + ox, 18, width - 230)
      const cardY = isMobile
        ? MathUtils.clamp(projected.y + oy * 0.55, 68, height - 150)
        : MathUtils.clamp(projected.y + oy, 64, height - 110)

      if (cardEl) {
        cardEl.style.visibility = showCard ? "visible" : "hidden"
        cardEl.style.opacity = showCard ? alpha.toFixed(3) : "0"
        cardEl.style.transform = `translate3d(${cardX.toFixed(1)}px, ${cardY.toFixed(1)}px, 0)`
      }

      if (lineEl) {
        if (!showCard) {
          lineEl.setAttribute("opacity", "0")
        } else {
          const elbowX = projected.x + (cardX - projected.x) * 0.45
          const elbowY = cardY + 18
          lineEl.setAttribute(
            "points",
            `${projected.x.toFixed(1)},${projected.y.toFixed(1)} ${elbowX.toFixed(1)},${elbowY.toFixed(1)} ${cardX.toFixed(1)},${elbowY.toFixed(1)}`
          )
          lineEl.setAttribute("opacity", (alpha * 0.85).toFixed(3))
        }
      }
    })
  })

  return (
    <KitHtml>
      <div
        ref={rootRef}
        className="pointer-events-none absolute inset-0 overflow-hidden select-none"
        style={{ fontFamily: "Poppins, sans-serif" }}
        data-kit-hud={theme.id}
      >
        {/* Capa SVG única para líneas guía, huesos de pose y arcos de ángulo */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <filter id={`kit-hud-glow-${theme.id}`}>
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Líneas guía de marcadores */}
          {markers.map((marker, idx) => {
            const stroke = toneColor(theme, marker.tone)
            return (
              <polyline
                key={marker.id}
                ref={(el) => {
                  markerLineRefs.current[idx] = el
                }}
                fill="none"
                stroke={stroke}
                strokeWidth={1.35}
                strokeDasharray="3 2"
                opacity={0}
              />
            )
          })}

          {/* Huesos de esqueleto de pose */}
          {skeleton?.bones.map(([fromId, toId], idx) => (
            <line
              key={`${fromId}-${toId}`}
              ref={(el) => {
                boneRefs.current[idx] = el
              }}
              stroke={theme.primary}
              strokeWidth={2.2}
              strokeLinecap="round"
              filter={`url(#kit-hud-glow-${theme.id})`}
              opacity={0}
            />
          ))}

          {/* Arco de ángulo biométrico */}
          {skeleton?.angleGauge ? (
            <g ref={angleGroupRef} opacity={0}>
              <path
                ref={angleArcRef}
                fill={theme.glowColor}
                stroke={theme.accent}
                strokeWidth={1.6}
              />
            </g>
          ) : null}

          {/* Articulaciones (keypoints) */}
          {skeleton?.joints.map((joint, idx) => (
            <circle
              key={joint.id}
              ref={(el) => {
                jointRefs.current[idx] = el
              }}
              r={joint.accent ? 5.2 : 3.8}
              fill={joint.accent ? theme.accent : theme.text}
              stroke={theme.background}
              strokeWidth={1.5}
              opacity={0}
            />
          ))}
        </svg>

        {/* Etiqueta flotante del ángulo biométrico */}
        {skeleton?.angleGauge ? (
          <div
            ref={angleTagRef}
            className="pointer-events-none absolute top-0 left-0 rounded px-2 py-1 text-[11px] font-medium shadow-md"
            style={{
              background: theme.surfaceElevated,
              border: `1px solid ${theme.borderStrong}`,
              color: theme.accent,
              opacity: 0,
              visibility: "hidden",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span className="mr-1.5 text-[10px] opacity-80">
              {skeleton.angleGauge.label}
            </span>
            <span ref={angleTextRef} className="font-semibold">
              0.0°
            </span>
          </div>
        ) : null}

        {/* Bounding Boxes 3D proyectados con esquinas broadcast */}
        {boxes.map((box, idx) => {
          const isHighlighted = highlightedBoxId === box.id
          const frameColor = isHighlighted ? theme.accent : theme.primary

          return (
            <div
              key={box.id}
              ref={(el) => {
                boxRefs.current[idx] = el
              }}
              className="pointer-events-none absolute top-0 left-0"
              style={{
                opacity: 0,
                visibility: "hidden",
                border: `1px solid ${isHighlighted ? theme.borderStrong : theme.border}`,
                background: isHighlighted
                  ? "rgba(245, 196, 81, 0.06)"
                  : "rgba(61, 139, 255, 0.03)",
                boxShadow: isHighlighted
                  ? `0 0 24px ${theme.glowColor}, inset 0 0 16px ${theme.glowColor}`
                  : "none",
              }}
            >
              {/* Esquinas de precisión tipo broadcast */}
              <span
                className="absolute -top-[1px] -left-[1px] h-3.5 w-3.5 border-t-2 border-l-2"
                style={{ borderColor: frameColor }}
              />
              <span
                className="absolute -top-[1px] -right-[1px] h-3.5 w-3.5 border-t-2 border-r-2"
                style={{ borderColor: frameColor }}
              />
              <span
                className="absolute -bottom-[1px] -left-[1px] h-3.5 w-3.5 border-b-2 border-l-2"
                style={{ borderColor: frameColor }}
              />
              <span
                className="absolute -right-[1px] -bottom-[1px] h-3.5 w-3.5 border-r-2 border-b-2"
                style={{ borderColor: frameColor }}
              />

              {/* Barra superior interactiva (≥ 44px de alto táctil) */}
              <button
                type="button"
                aria-pressed={isHighlighted}
                onClick={() => handleToggleBox(box.id)}
                className="pointer-events-auto -mt-9 flex min-h-11 min-w-11 cursor-pointer items-center gap-2 rounded px-2.5 py-1 text-left text-[11px] font-medium transition-transform active:scale-95"
                style={{
                  background: theme.surfaceElevated,
                  border: `1px solid ${isHighlighted ? theme.accent : theme.border}`,
                  color: theme.text,
                  boxShadow: `0 6px 18px rgba(0,0,0,0.28)`,
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: frameColor }}
                />
                <span className="font-semibold tracking-tight">
                  {box.label}
                </span>
                {box.tag ? (
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{
                      background: theme.glowColor,
                      color: theme.accent,
                    }}
                  >
                    {box.tag}
                  </span>
                ) : null}
                {box.confidence !== undefined ? (
                  <span
                    ref={(el) => {
                      boxConfRefs.current[idx] = el
                    }}
                    className="ml-1 font-mono text-[10px]"
                    style={{
                      color: theme.textMuted,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    94% CONF
                  </span>
                ) : null}
              </button>

              {/* Tira inferior de telemetría del volumen */}
              {box.footerMetrics && box.footerMetrics.length > 0 ? (
                <div
                  className="absolute inset-x-0 -bottom-7 flex items-center justify-between gap-2 rounded px-2 py-1 text-[10px]"
                  style={{
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    color: theme.textMuted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {box.footerMetrics.map((m) => (
                    <span key={m.label} className="truncate">
                      <strong style={{ color: theme.text }}>{m.value}</strong>{" "}
                      {m.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}

        {/* Pines de anclaje 3D (áreas táctiles de 44×44 px) + tarjetas proyectadas */}
        {markers.map((marker, idx) => {
          const accent = toneColor(theme, marker.tone)
          const isSelected = selectedId === marker.id

          return (
            <div key={marker.id}>
              {/* Pin sobre la coordenada 3D proyectada */}
              <div
                ref={(el) => {
                  markerAnchorRefs.current[idx] = el
                }}
                className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
                style={{ opacity: 0, visibility: "hidden" }}
              >
                <button
                  type="button"
                  aria-label={`Inspeccionar ${marker.label}`}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectMarker(marker.id)}
                  className="pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus:outline-none"
                >
                  <span
                    className="relative flex h-4 w-4 items-center justify-center rounded-full transition-transform"
                    style={{
                      background: theme.surfaceElevated,
                      border: `1.5px solid ${isSelected ? theme.accent : accent}`,
                      boxShadow: `0 0 12px ${theme.glowColor}`,
                      transform: isSelected ? "scale(1.2)" : "scale(1)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: isSelected ? theme.accent : accent,
                      }}
                    />
                  </span>
                </button>
              </div>

              {/* Tarjeta de datos proyectada */}
              <div
                ref={(el) => {
                  markerCardRefs.current[idx] = el
                }}
                onClick={() => handleSelectMarker(marker.id)}
                className="pointer-events-auto absolute top-0 left-0 min-w-[168px] cursor-pointer rounded-md px-3 py-2 backdrop-blur-md transition-colors"
                style={{
                  opacity: 0,
                  visibility: "hidden",
                  background: isSelected
                    ? theme.surfaceElevated
                    : theme.surface,
                  borderTop: `1px solid ${isSelected ? theme.borderStrong : theme.border}`,
                  borderRight: `1px solid ${isSelected ? theme.borderStrong : theme.border}`,
                  borderBottom: `1px solid ${isSelected ? theme.borderStrong : theme.border}`,
                  borderLeft: `3px solid ${isSelected ? theme.accent : accent}`,
                  color: theme.text,
                  boxShadow: "0 10px 26px rgba(0, 0, 0, 0.26)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: theme.textMuted }}
                  >
                    {marker.label}
                  </span>
                  {marker.code ? (
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[9px]"
                      style={{
                        background: theme.glowColor,
                        color: isSelected ? theme.accent : accent,
                      }}
                    >
                      {marker.code}
                    </span>
                  ) : null}
                </div>
                <div
                  className="mt-0.5 flex items-baseline gap-1.5"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <span
                    ref={(el) => {
                      markerValueRefs.current[idx] = el
                    }}
                    className="text-base font-semibold tracking-tight"
                    style={{ color: theme.text }}
                  >
                    {typeof marker.value === "string" ? marker.value : "—"}
                  </span>
                  {marker.unit ? (
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: isSelected ? theme.accent : accent }}
                    >
                      {marker.unit}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </KitHtml>
  )
}
