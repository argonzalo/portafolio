import { useEffect, useRef, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { KIT_THEMES } from "@/scenes/kit"
import { COCO_BONES, SHOT } from "./data"
import { setNode, setNodeAt, type PanelNodes } from "./panel"

const theme = KIT_THEMES.vibo

/**
 * Monta DOM interactivo sobre el contenido del capítulo. La capa del canvas
 * queda debajo de las secciones del recorrido y no recibe clics.
 */
export function BodyLayer({ children }: { children: ReactNode }) {
  const rootRef = useRef<Root | null>(null)

  useEffect(() => {
    const host = document.createElement("div")
    host.dataset.viboLayer = ""
    host.style.position = "fixed"
    host.style.inset = "0"
    host.style.pointerEvents = "none"
    host.style.zIndex = "30"
    document.body.appendChild(host)
    const root = createRoot(host)
    rootRef.current = root
    root.render(children)
    return () => {
      rootRef.current = null
      queueMicrotask(() => {
        root.unmount()
        host.remove()
      })
    }
    // El contenedor se crea una vez por montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    rootRef.current?.render(children)
  }, [children])

  return null
}

type Props = {
  nodes: PanelNodes
  isMobile: boolean
  paused: boolean
  highlight: boolean
  onTogglePause: () => void
  onToggleHighlight: () => void
  onScrub: (value: number) => void
  onScrubEnd: () => void
}

const button =
  "pointer-events-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"

export function ViboPanel({
  nodes,
  isMobile,
  paused,
  highlight,
  onTogglePause,
  onToggleHighlight,
  onScrub,
  onScrubEnd,
}: Props) {
  const size = isMobile ? 104 : 168
  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      <div
        ref={(el) => setNode(nodes, "inset", el)}
        aria-hidden="true"
        className="absolute rounded-md backdrop-blur-md"
        style={{
          left: isMobile ? 12 : "clamp(1rem, 4vw, 3.5rem)",
          bottom: isMobile ? 258 : 150,
          width: size + 16,
          padding: 8,
          opacity: 0,
          visibility: "hidden",
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          color: theme.textMuted,
        }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] tracking-wide uppercase">
          <span style={{ color: theme.text }}>Video real · 2D</span>
          <span
            ref={(el) => setNode(nodes, "insetFrame", el)}
            className="font-mono"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            f{SHOT.keyFrame}
          </span>
        </div>
        <svg
          width={size}
          height={size}
          viewBox="0 0 1 1"
          className="block rounded-sm"
          style={{ background: "rgba(2, 8, 20, 0.85)" }}
        >
          <rect
            ref={(el) => setNode(nodes, "insetBox", el)}
            fill="none"
            stroke={theme.primary}
            strokeWidth={0.008}
          />
          {COCO_BONES.map(([a, b], i) => (
            <line
              key={`${a}-${b}`}
              ref={(el) => setNodeAt(nodes.insetBones, i, el)}
              stroke={theme.primary}
              strokeWidth={0.012}
              strokeLinecap="round"
            />
          ))}
          {SHOT.frames[0].points.map((_, i) => (
            <circle
              key={i}
              ref={(el) => setNodeAt(nodes.insetJoints, i, el)}
              r={0.013}
              fill={i === 10 ? theme.accent : theme.text}
            />
          ))}
          <circle ref={(el) => setNode(nodes, "insetBall", el)} r={0.02} fill={theme.accent} />
        </svg>
        {!isMobile ? (
          <p className="mt-1.5 text-[10px] leading-snug">
            Detección real del pipeline sobre la cámara del club. El 3D
            reinterpreta ese instante.
          </p>
        ) : null}
      </div>

      <div
        ref={(el) => setNode(nodes, "root", el)}
        className="absolute left-1/2 flex -translate-x-1/2 flex-col gap-2 rounded-lg p-3 backdrop-blur-md"
        style={{
          bottom: isMobile ? 80 : 28,
          width: isMobile ? "calc(100vw - 24px)" : 420,
          opacity: 0,
          visibility: "hidden",
          background: theme.surfaceElevated,
          border: `1px solid ${theme.border}`,
          color: theme.text,
          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={button}
            aria-pressed={paused}
            onClick={onTogglePause}
            style={{
              background: paused ? theme.accent : "rgba(61, 139, 255, 0.16)",
              color: paused ? "#071426" : theme.text,
              border: `1px solid ${paused ? theme.accent : theme.border}`,
              outlineColor: theme.accent,
            }}
          >
            {paused ? "Seguir con el scroll" : "Pausar golpe"}
          </button>
          <button
            type="button"
            className={button}
            aria-pressed={highlight}
            onClick={onToggleHighlight}
            style={{
              background: highlight ? "rgba(245, 196, 81, 0.16)" : "transparent",
              color: highlight ? theme.accent : theme.textMuted,
              border: `1px solid ${highlight ? theme.borderStrong : theme.border}`,
              outlineColor: theme.accent,
            }}
          >
            Resaltar detección
          </button>
        </div>
        <label className="flex flex-col gap-1 text-[11px]" style={{ color: theme.textMuted }}>
          <span>Arrastrá para recorrer el golpe en cámara lenta</span>
          <input
            ref={(el) => setNode(nodes, "slider", el)}
            type="range"
            min={0}
            max={1}
            step={0.005}
            defaultValue={0}
            aria-label="Instante del golpe"
            className="pointer-events-auto w-full cursor-pointer"
            style={{
              minHeight: 44,
              accentColor: theme.accent,
              touchAction: "pan-y",
            }}
            onInput={(event) => onScrub(Number(event.currentTarget.value))}
            onPointerUp={onScrubEnd}
            onKeyUp={onScrubEnd}
          />
        </label>
      </div>
    </div>
  )
}
