import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { MathUtils } from "three"
import {
  beatEnvelope,
  buildTrendSvgGeometry,
  formatKitNumber,
  phase,
} from "./cameraRig"
import { KitHtml } from "./KitHtml"
import { KIT_THEMES, type KitTheme } from "./theme"

export type KitCounterDef = {
  id: string
  label: string
  from?: number
  to: number
  decimals?: number
  prefix?: string
  suffix?: string
  detail?: string
  tone?: "primary" | "accent" | "positive"
  /** Rango de progreso `[start, end]` donde cuenta de `from` a `to`. */
  range?: [number, number]
}

export type KitBarDef = {
  id: string
  label: string
  /** Valor objetivo 0..100 (%). */
  value: number
  displayValue?: string
  tone?: "primary" | "accent" | "positive" | "danger"
}

export type KitTrendSeries = {
  title: string
  subtitle?: string
  /** Muestras normalizadas 0..1 a lo largo del eje horizontal. */
  samples: readonly number[]
  /** Índice del pico que dispara la alerta o hito (opcional). */
  peakIndex?: number
  peakLabel?: string
  alertText?: string
  unitLabel?: string
  /** Rango de progreso `[start, end]` en el que la curva se traza de izquierda a derecha. */
  drawRange?: [number, number]
}

export type TelemetryDeckProps = {
  progress: { readonly current: number }
  isMobile: boolean
  active?: boolean
  theme?: KitTheme
  eyebrow?: string
  heading: string
  summary?: string
  counters?: readonly KitCounterDef[]
  bars?: readonly KitBarDef[]
  trend?: KitTrendSeries
  /** Ventana de visibilidad `[enterStart, enterEnd, exitStart, exitEnd]`. */
  range?: [number, number, number, number]
  /** Alineación en el viewport para convivir con el héroe 3D de la escena. */
  placement?: "right" | "bottom-right" | "center" | "bottom"
}

function resolveToneColor(
  theme: KitTheme,
  tone: "primary" | "accent" | "positive" | "danger" = "primary"
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
 * Panel de contadores numéricos, barras de telemetría y curva de tendencia en vivo (`03` §2).
 *
 * - Cero `setState` por frame: interpola contadores, máscara SVG de la curva,
 *   cursor de lectura y barras con `transform: scaleX()` dentro de `useFrame`.
 */
export function TelemetryDeck({
  progress,
  isMobile,
  active = true,
  theme = KIT_THEMES.vibo,
  eyebrow,
  heading,
  summary,
  counters = [],
  bars = [],
  trend,
  range = [0, 0.04, 0.96, 1],
  placement = "right",
}: TelemetryDeckProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const counterValueRefs = useRef<(HTMLSpanElement | null)[]>([])
  const barFillRefs = useRef<(HTMLDivElement | null)[]>([])
  const barPctRefs = useRef<(HTMLSpanElement | null)[]>([])
  const clipRectRef = useRef<SVGRectElement>(null)
  const cursorDotRef = useRef<SVGCircleElement>(null)
  const peakPulseRef = useRef<SVGCircleElement>(null)
  const alertBannerRef = useRef<HTMLDivElement>(null)

  const svgWidth = 316
  const svgHeight = 88

  const trendGeo = useMemo(
    () =>
      trend
        ? buildTrendSvgGeometry(trend.samples, svgWidth, svgHeight)
        : null,
    [trend]
  )

  useFrame(() => {
    const card = cardRef.current
    if (!card) return

    const p = progress.current
    const env = active
      ? beatEnvelope(p, range[0], range[1], range[2], range[3])
      : 0

    if (env <= 0.01) {
      card.style.opacity = "0"
      card.style.visibility = "hidden"
      return
    }

    const slideY = (1 - env) * 14
    card.style.visibility = "visible"
    card.style.opacity = env.toFixed(3)
    card.style.transform = `translate3d(0, ${slideY.toFixed(1)}px, 0)`

    // 1. Contadores animados por progreso
    counters.forEach((counter, idx) => {
      const el = counterValueRefs.current[idx]
      if (!el) return
      const [start, end] = counter.range ?? [
        range[0],
        Math.min(1, range[1] + 0.14),
      ]
      const t = phase(p, start, end)
      const val = MathUtils.lerp(counter.from ?? 0, counter.to, t)
      el.textContent = formatKitNumber(
        val,
        counter.decimals ?? 0,
        counter.prefix ?? "",
        counter.suffix ?? ""
      )
    })

    // 2. Barras de distribución (GPU scaleX)
    bars.forEach((bar, idx) => {
      const fill = barFillRefs.current[idx]
      const pct = barPctRefs.current[idx]
      const t = phase(p, range[0], Math.min(1, range[1] + 0.15))
      const currentRatio = (bar.value / 100) * t
      if (fill) {
        fill.style.transform = `scaleX(${MathUtils.clamp(currentRatio, 0.02, 1).toFixed(3)})`
      }
      if (pct && !bar.displayValue) {
        pct.textContent = `${Math.round(bar.value * t)}%`
      }
    })

    // 3. Curva de tendencia SVG progresiva y pico de alerta
    if (trend && trendGeo && trendGeo.coords.length > 0) {
      const [drawStart, drawEnd] = trend.drawRange ?? [
        range[0],
        Math.min(1, range[1] + 0.16),
      ]
      const drawT = phase(p, drawStart, drawEnd)

      if (clipRectRef.current) {
        clipRectRef.current.setAttribute(
          "width",
          (svgWidth * MathUtils.clamp(drawT, 0.02, 1)).toFixed(1)
        )
      }

      const exactIdx = drawT * (trendGeo.coords.length - 1)
      const i0 = Math.floor(exactIdx)
      const i1 = Math.min(trendGeo.coords.length - 1, i0 + 1)
      const frac = exactIdx - i0
      const cx = MathUtils.lerp(
        trendGeo.coords[i0].x,
        trendGeo.coords[i1].x,
        frac
      )
      const cy = MathUtils.lerp(
        trendGeo.coords[i0].y,
        trendGeo.coords[i1].y,
        frac
      )

      if (cursorDotRef.current) {
        cursorDotRef.current.setAttribute("cx", cx.toFixed(1))
        cursorDotRef.current.setAttribute("cy", cy.toFixed(1))
      }

      const peakIdx = trend.peakIndex ?? -1
      const peakReached =
        peakIdx >= 0 &&
        drawT >= peakIdx / Math.max(1, trendGeo.coords.length - 1)

      if (peakPulseRef.current) {
        peakPulseRef.current.setAttribute("opacity", peakReached ? "1" : "0")
      }
      if (alertBannerRef.current) {
        alertBannerRef.current.style.opacity = peakReached ? "1" : "0.28"
        alertBannerRef.current.style.borderColor = peakReached
          ? theme.borderStrong
          : theme.border
      }
    }
  })

  const containerPositionClass = isMobile
    ? "inset-x-3 bottom-16 flex justify-center"
    : placement === "center"
      ? "inset-0 flex items-center justify-center p-6"
      : placement === "bottom"
        ? "inset-x-6 bottom-8 flex justify-center"
        : placement === "bottom-right"
          ? "right-6 bottom-8 flex justify-end"
          : "top-1/2 right-7 -translate-y-1/2 flex justify-end"

  const peakCoord =
    trend?.peakIndex !== undefined &&
    trendGeo &&
    trendGeo.coords[trend.peakIndex]
      ? trendGeo.coords[trend.peakIndex]
      : null

  const clipId = `kit-trend-clip-${theme.id}-${placement}`
  const gradId = `kit-trend-grad-${theme.id}-${placement}`

  return (
    <KitHtml>
      <div
        className={`pointer-events-none absolute ${containerPositionClass} select-none`}
        style={{ fontFamily: "Poppins, sans-serif" }}
        data-kit-telemetry={theme.id}
      >
        <div
          ref={cardRef}
          className="pointer-events-auto w-full max-w-[360px] rounded-lg p-4 backdrop-blur-md"
          style={{
            opacity: 0,
            visibility: "hidden",
            background: theme.surfaceElevated,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            boxShadow: "0 18px 42px rgba(0, 0, 0, 0.34)",
          }}
        >
          {/* Cabecera del panel */}
          <div className="flex items-center justify-between gap-2">
            {eyebrow ? (
              <span
                className="font-mono text-[10px] font-medium tracking-wider"
                style={{ color: theme.accent }}
              >
                {eyebrow}
              </span>
            ) : null}
            <span
              className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                background: theme.glowColor,
                color: theme.primary,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: theme.accent }}
              />
              TELEMETRÍA EN VIVO
            </span>
          </div>

          <h3
            className="mt-1.5 text-base font-semibold tracking-tight sm:text-lg"
            style={{ color: theme.text }}
          >
            {heading}
          </h3>
          {summary ? (
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: theme.textMuted }}
            >
              {summary}
            </p>
          ) : null}

          {/* Grilla de contadores animados */}
          {counters.length > 0 ? (
            <div
              className={`mt-3 grid gap-2 ${
                counters.length === 1
                  ? "grid-cols-1"
                  : counters.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2"
              }`}
            >
              {counters.map((counter, idx) => {
                const color = resolveToneColor(theme, counter.tone)
                return (
                  <div
                    key={counter.id}
                    className="rounded-md px-2.5 py-2"
                    style={{
                      background: theme.surface,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    <div
                      className="text-[11px] font-medium"
                      style={{ color: theme.textMuted }}
                    >
                      {counter.label}
                    </div>
                    <div
                      className="mt-0.5 text-lg font-semibold tracking-tight sm:text-xl"
                      style={{
                        color,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span
                        ref={(el) => {
                          counterValueRefs.current[idx] = el
                        }}
                      >
                        {formatKitNumber(
                          counter.from ?? 0,
                          counter.decimals ?? 0,
                          counter.prefix ?? "",
                          counter.suffix ?? ""
                        )}
                      </span>
                    </div>
                    {counter.detail ? (
                      <div
                        className="mt-0.5 font-mono text-[10px]"
                        style={{ color: theme.textMuted }}
                      >
                        {counter.detail}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {/* Curva de tendencia SVG con pico y alerta */}
          {trend && trendGeo ? (
            <div
              className="mt-3 rounded-md p-2.5"
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span
                  className="text-xs font-medium"
                  style={{ color: theme.text }}
                >
                  {trend.title}
                </span>
                {trend.unitLabel ? (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: theme.textMuted }}
                  >
                    {trend.unitLabel}
                  </span>
                ) : null}
              </div>

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="h-[84px] w-full overflow-visible"
                role="img"
                aria-label={trend.title}
              >
                <defs>
                  <clipPath id={clipId}>
                    <rect
                      ref={clipRectRef}
                      x="0"
                      y="0"
                      width={svgWidth}
                      height={svgHeight}
                    />
                  </clipPath>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={theme.primary}
                      stopOpacity="0.42"
                    />
                    <stop
                      offset="100%"
                      stopColor={theme.primary}
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>

                {[0.25, 0.55, 0.85].map((ratio) => (
                  <line
                    key={ratio}
                    x1="8"
                    x2={svgWidth - 8}
                    y1={svgHeight * ratio}
                    y2={svgHeight * ratio}
                    stroke={theme.border}
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                ))}

                <path
                  d={trendGeo.linePath}
                  fill="none"
                  stroke={theme.border}
                  strokeWidth="1.25"
                />

                <g clipPath={`url(#${clipId})`}>
                  <path d={trendGeo.areaPath} fill={`url(#${gradId})`} />
                  <path
                    d={trendGeo.linePath}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </g>

                {peakCoord ? (
                  <g ref={peakPulseRef} opacity="0">
                    <circle
                      cx={peakCoord.x}
                      cy={peakCoord.y}
                      r="8"
                      fill="none"
                      stroke={theme.accent}
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={peakCoord.x}
                      cy={peakCoord.y}
                      r="3.5"
                      fill={theme.accent}
                    />
                  </g>
                ) : null}

                <circle
                  ref={cursorDotRef}
                  cx={trendGeo.coords[0]?.x ?? 10}
                  cy={trendGeo.coords[0]?.y ?? 44}
                  r="4"
                  fill={theme.accent}
                  stroke={theme.background}
                  strokeWidth="1.5"
                />
              </svg>

              {trend.alertText ? (
                <div
                  ref={alertBannerRef}
                  className="mt-1.5 flex items-center justify-between gap-2 rounded px-2.5 py-1.5 text-[11px] transition-opacity"
                  style={{
                    background: theme.glowColor,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                  }}
                >
                  <span className="truncate font-medium">
                    {trend.alertText}
                  </span>
                  {trend.peakLabel ? (
                    <span
                      className="shrink-0 font-mono text-[10px] font-semibold"
                      style={{ color: theme.accent }}
                    >
                      {trend.peakLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Barras de distribución / sentimiento / cobertura */}
          {bars.length > 0 ? (
            <div className="mt-3 space-y-2">
              {bars.map((bar, idx) => {
                const barColor = resolveToneColor(theme, bar.tone)
                return (
                  <div key={bar.id}>
                    <div
                      className="flex items-center justify-between text-[11px]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      <span style={{ color: theme.textMuted }}>
                        {bar.label}
                      </span>
                      <span
                        ref={(el) => {
                          barPctRefs.current[idx] = el
                        }}
                        className="font-mono font-semibold"
                        style={{ color: theme.text }}
                      >
                        {bar.displayValue ?? `${bar.value}%`}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: theme.border }}
                    >
                      <div
                        ref={(el) => {
                          barFillRefs.current[idx] = el
                        }}
                        className="h-full w-full origin-left rounded-full"
                        style={{
                          background: barColor,
                          transform: "scaleX(0.02)",
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </KitHtml>
  )
}
