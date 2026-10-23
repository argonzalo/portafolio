import { useEffect, useRef, type RefObject } from "react"
import { createPortal } from "react-dom"
import type { SceneProps } from "@/experience/types"
import type { Presentation } from "@/experience/presentation"
import { envelope, ramp } from "@/experience/choreography"
import { readingVeil } from "./timing"
import "./naturalis.css"

const copy = [
  [
    "Espacio para cuidar.",
    "La tecnología trabaja en silencio. El equipo se dedica a atender.",
  ],
  [
    "La agenda no debería pesar.",
    "Turnos tachados, cambios por mensaje y confirmaciones pendientes.",
  ],
  [
    "Dos apps. Una sola agenda.",
    "El cliente reserva. El equipo recibe el turno en Natuadmin.",
  ],
  [
    "Mientras el equipo descansa.",
    "Turnos fijos, confirmaciones y estadísticas siguen en orden.",
  ],
  [
    "Orden sin esfuerzo.",
    "Menos administración. Más tiempo para las personas.",
  ],
]

export function NaturalisOverlay({
  progress,
  active,
  presentation,
}: SceneProps & { presentation: RefObject<Presentation> | null }) {
  const root = useRef<HTMLDivElement>(null),
    title = useRef<HTMLHeadingElement>(null),
    subtitle = useRef<HTMLParagraphElement>(null)
  const results = useRef<HTMLDListElement>(null),
    tasks = useRef<HTMLOListElement>(null)
  useEffect(() => {
    let frame = 0,
      last = -1
    const show = (node: HTMLElement | null, opacity: number) => {
      if (!node) return
      node.style.opacity = String(opacity)
      node.style.visibility = opacity > 0.001 ? "visible" : "hidden"
      node.inert = opacity < 0.95
    }
    const update = () => {
      const p = progress.current,
        alpha = active ? (presentation?.current.opacity ?? 1) : 0
      const beat = Math.min(4, Math.floor(p * 5))
      show(root.current, alpha)
      if (root.current) {
        root.current.dataset.beat = String(beat)
        root.current.style.setProperty("--nat-reading", String(readingVeil(p)))
      }
      if (beat !== last) {
        last = beat
        if (title.current) title.current.textContent = copy[beat][0]
        if (subtitle.current) subtitle.current.textContent = copy[beat][1]
      }
      show(results.current, alpha * ramp(p, 0.8, 0.833))
      show(tasks.current, alpha * envelope(p, 0.6, 0.8, 0.035))
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [progress, active, presentation])
  return createPortal(
    <div
      className="naturalis-overlay"
      ref={root}
      style={{ visibility: "hidden" }}
    >
      <div className="naturalis-copy">
        <span className="naturalis-brand">naturalis</span>
        <h2 ref={title}>{copy[0][0]}</h2>
        <p ref={subtitle}>{copy[0][1]}</p>
        <a href="/projects/naturalis">Ver caso completo</a>
      </div>
      <ol
        className="naturalis-tasks"
        ref={tasks}
        aria-label="Trabajo automático"
      >
        <li>Turnos recurrentes generados</li>
        <li>Confirmaciones enviadas</li>
        <li>Estadísticas actualizadas</li>
      </ol>
      <dl className="naturalis-results" ref={results}>
        <div>
          <dt>Clientes registrados</dt>
          <dd>+900</dd>
        </div>
        <div>
          <dt>Turnos por mes</dt>
          <dd>+70</dd>
        </div>
      </dl>
    </div>,
    document.body
  )
}
