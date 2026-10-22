import { useEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"
import type { SceneProps } from "@/experience/types"
import type { Presentation } from "@/experience/presentation"
import { envelope, ramp } from "@/experience/choreography"
import { emitInteract } from "@/guide/signals"
import data from "./dataset.json"
import "./pirp.css"

const headlines = [
  "Escuchar antes de decidir.",
  "Seis voces. Una conversación.",
  "Cada señal encuentra su lugar.",
  "Detectar el cambio a tiempo.",
  "Una lectura. Un próximo paso.",
]
const subtitles = [
  "Reputación, contexto y estrategia en un mismo pulso.",
  "Tocá una noticia y descubrí su clasificación.",
  "Agentes que agrupan por tema y sentimiento.",
  "El termómetro convierte una variación en una alerta.",
  "La propuesta se construye a partir de las señales.",
]
const sentiment: Record<string, string> = {
  positive: "Positivo",
  negative: "Negativo",
  neutral: "Neutral",
}

export function PirpOverlay({
  progress,
  active,
  presentation,
  screenIndex,
  onScreenChange,
  controlsAnchor,
}: SceneProps & {
  presentation: RefObject<Presentation> | null
  screenIndex: number
  onScreenChange: (index: number) => void
  controlsAnchor: RefObject<{ x: number; y: number }>
}) {
  const root = useRef<HTMLDivElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const subtitle = useRef<HTMLParagraphElement>(null)
  const feed = useRef<HTMLElement>(null)
  const graph = useRef<HTMLElement>(null)
  const dashboard = useRef<HTMLElement>(null)
  const result = useRef<HTMLElement>(null)
  const trace = useRef<SVGPathElement>(null)
  const score = useRef<HTMLElement>(null)
  const alert = useRef<HTMLDivElement>(null)
  const actions = useRef<(HTMLParagraphElement | null)[]>([])
  const phoneControls = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [capture, setCapture] = useState<number | null>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let frame = 0
    let previousBeat = -1
    const visibility = (node: HTMLElement | null, alpha: number) => {
      if (!node) return
      node.style.opacity = String(alpha)
      node.style.visibility = alpha > 0.001 ? "visible" : "hidden"
      node.inert = alpha < 0.95 || !active
    }
    const update = () => {
      const p = progress.current
      const alpha = active ? (presentation?.current.opacity ?? 1) : 0
      const beat = Math.min(4, Math.floor(p * 5))
      visibility(root.current, alpha)
      if (beat !== previousBeat) {
        previousBeat = beat
        if (title.current) title.current.textContent = headlines[beat]
        if (subtitle.current) subtitle.current.textContent = subtitles[beat]
      }
      visibility(feed.current, envelope(p, 0.2, 0.4, 0.025))
      visibility(graph.current, envelope(p, 0.4, 0.6, 0.025))
      visibility(dashboard.current, envelope(p, 0.6, 0.8, 0.025))
      visibility(result.current, envelope(p, 0.8, 1.1, 0.025))
      visibility(phoneControls.current, envelope(p, 0.6, 1.02, 0.035))
      if (phoneControls.current) {
        const { x, y } = controlsAnchor.current
        phoneControls.current.style.transform = `translate3d(${x}px,${y}px,0) translateX(-50%)`
      }
      const change = ramp(p, 0.61, 0.72)
      if (trace.current)
        trace.current.style.strokeDashoffset = String(1 - change)
      if (score.current)
        score.current.textContent = `−${Math.round(change * 42)}%`
      visibility(alert.current, ramp(p, 0.66, 0.7))
      data.sceneBeats.beat5_strategy.actions.forEach((text, i) => {
        const node = actions.current[i]
        if (!node) return
        const length = Math.round(
          text.length * ramp(p, 0.8 + i * 0.006, 0.833 + i * 0.006)
        )
        node.textContent = text.slice(3, Math.max(3, length))
      })
      frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [progress, active, presentation, controlsAnchor])

  useEffect(() => {
    if (capture === null) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    close.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCapture(null)
        opener.current?.focus()
      }
      if (event.key === "Tab") {
        const buttons = root.current?.querySelectorAll<HTMLButtonElement>(
          "[data-pirp-dialog] button"
        )
        if (!buttons?.length) return
        const first = buttons[0],
          last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
    }
  }, [capture])

  const item = selected === null ? null : data.headlines[selected]
  return createPortal(
    <div className="pirp-overlay" ref={root} style={{ visibility: "hidden" }}>
      <header className="pirp-heading">
        <h2 ref={title}>{headlines[0]}</h2>
        <p ref={subtitle}>{subtitles[0]}</p>
      </header>
      <span className="pirp-demo">Demo ficticia · sin datos de clientes</span>
      <section
        className="pirp-feed"
        ref={feed}
        aria-label="Noticias ficticias para clasificar"
      >
        <div className="pirp-news-buttons">
          {data.headlines.map((news, i) => (
            <button
              key={news.headline}
              type="button"
              aria-pressed={selected === i}
              onClick={() => {
                setSelected(i)
                emitInteract(`pirp:card:${i}`)
              }}
            >
              <span>{news.source}</span>
              <strong>{news.headline}</strong>
              <small>
                {selected === i ? "Clasificada" : "Clasificar noticia"}
              </small>
            </button>
          ))}
        </div>
        {item && (
          <div className="pirp-classified" role="status">
            <strong>
              {data.topics.find((t) => t.id === item.topic)?.label}
            </strong>
            <span data-sentiment={item.sentiment}>
              {sentiment[item.sentiment]}
            </span>
            <p>{item.snippet}</p>
          </div>
        )}
      </section>
      <section
        className="pirp-topics"
        ref={graph}
        aria-label="Clasificación por temas"
      >
        {data.topics.map((topic) => (
          <div key={topic.id}>
            <span style={{ background: topic.color }} />
            <strong>{topic.label}</strong>
            <small>
              {data.headlines.filter((h) => h.topic === topic.id).length}{" "}
              {data.headlines.filter((h) => h.topic === topic.id).length === 1
                ? "señal"
                : "señales"}
            </small>
          </div>
        ))}
        <p>
          Sentimiento: <span className="pirp-positive">positivo</span> / neutral
          / <span className="pirp-negative">negativo</span>
        </p>
      </section>
      <section
        className="pirp-dashboard"
        ref={dashboard}
        aria-label="Termómetro de reputación ficticio"
      >
        <p>Variación de sentimiento</p>
        <strong ref={score} className="pirp-score">
          −42%
        </strong>
        <span>en 60 minutos simulados</span>
        <svg
          viewBox="0 0 400 110"
          role="img"
          aria-label="Tendencia ficticia descendente con un pico negativo"
        >
          <path d="M0 25H400M0 60H400M0 95H400" stroke="#EFE9DD" opacity=".1" />
          <path
            ref={trace}
            d="M0 30 35 25 65 40 100 28 130 37 160 29 190 45 220 40 245 60 270 50 300 98 325 74 355 82 400 92"
            fill="none"
            stroke="#CF6975"
            strokeWidth="3"
            pathLength="1"
            strokeDasharray="1"
          />
        </svg>
        <div ref={alert} className="pirp-alert">
          <strong>{data.sceneBeats.beat4_alert.title}</strong>
          <p>{data.sceneBeats.beat4_alert.summary}</p>
        </div>
      </section>
      <section
        className="pirp-strategy"
        ref={result}
        aria-label="Propuesta estratégica ficticia"
      >
        <span>De la alerta a la acción</span>
        <h3>Recomendación estratégica</h3>
        <ol aria-label={data.sceneBeats.beat5_strategy.actions.join(" ")}>
          {data.sceneBeats.beat5_strategy.actions.map((_, i) => (
            <li key={i}>
              <span className="pirp-action-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>
                  {
                    [
                      "Aclarar el mensaje",
                      "Ordenar la agenda",
                      "Reducir la exposición",
                    ][i]
                  }
                </strong>
                <p
                  ref={(node) => {
                    actions.current[i] = node
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      </section>
      <nav
        className="pirp-phone-controls"
        ref={phoneControls}
        aria-label="Capturas del teléfono"
      >
        {[0, 1].map((index) => (
          <button
            key={index}
            type="button"
            aria-label={`Mostrar captura ${index + 1}`}
            aria-pressed={screenIndex === index}
            onClick={() => {
              onScreenChange(index)
              emitInteract(`pirp:screen:${index}`)
            }}
          >
            {index + 1}
          </button>
        ))}
        <button
          ref={opener}
          type="button"
          aria-label="Ampliar captura actual"
          onClick={() => {
            setCapture(screenIndex)
            emitInteract("pirp:capture:open")
          }}
        >
          <span aria-hidden="true">↗</span>
        </button>
      </nav>
      {capture !== null && active && (
        <div
          className="pirp-lightbox"
          data-pirp-dialog
          role="dialog"
          aria-modal="true"
          aria-label="Capturas reales de Pirp"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setCapture(null)
              opener.current?.focus()
            }
          }}
        >
          <div>
            <button
              ref={close}
              type="button"
              onClick={() => {
                setCapture(null)
                opener.current?.focus()
              }}
            >
              Cerrar capturas
            </button>
            <img
              src={`/images/proyects/varios/pirp/${capture + 1}.webp`}
              alt={`Interfaz real de Pirp, captura ${capture + 1} de 2`}
            />
            <nav aria-label="Galería de capturas">
              <button
                type="button"
                onClick={() => setCapture((capture + 1) % 2)}
              >
                Anterior
              </button>
              <span>{capture + 1} / 2</span>
              <button
                type="button"
                onClick={() => setCapture((capture + 1) % 2)}
              >
                Siguiente
              </button>
            </nav>
            <p>Interfaz real. La escena usa datos ficticios.</p>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
