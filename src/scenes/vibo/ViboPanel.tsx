import { useEffect, useRef, type ReactNode } from "react"
import { createRoot, type Root } from "react-dom/client"
import { COCO_BONES, SHOT } from "./data"
import { setNode, setNodeAt, type PanelNodes } from "./panel"
import { VIBO_THEME } from "./theme"

const theme = VIBO_THEME

/**
 * Monta DOM sobre el contenido del capítulo. La capa del canvas queda debajo
 * de las secciones del recorrido y no recibe clics.
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

type Props = { nodes: PanelNodes; isMobile: boolean }

/** Inserto 2D: bbox y keypoints reales del pipeline en el instante del golpe. */
export function PoseInset({ nodes, isMobile }: Props) {
  const size = isMobile ? 104 : 260
  return (
    <div
      ref={(el) => setNode(nodes, "inset", el)}
      aria-hidden="true"
      className="absolute rounded-md backdrop-blur-md"
      style={{
        fontFamily: "Poppins, sans-serif",
        left: isMobile ? 12 : "clamp(1rem, 4vw, 3.5rem)",
        bottom: isMobile ? 84 : 104,
        width: size + 20,
        padding: 10,
        opacity: 0,
        visibility: "hidden",
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        color: theme.textMuted,
      }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] tracking-wide uppercase">
        <span style={{ color: theme.text }}>Pose</span>
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
    </div>
  )
}
