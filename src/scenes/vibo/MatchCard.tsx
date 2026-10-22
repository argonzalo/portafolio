import { PLAYER } from "./data"
import { HEAT_BLOBS, MATCH_MINUTES, STYLE, WEAR, WEAR_DROP } from "./match"
import { setNode, type PanelNodes } from "./panel"
import { VIBO_COLORS, VIBO_THEME } from "./theme"

const theme = VIBO_THEME
const MUTED = theme.textMuted
const GRID = "rgba(255, 255, 255, 0.1)"
const LABEL = "text-[9px] font-mono tracking-[0.16em] uppercase"

function radarPoint(i: number, r: number): [number, number] {
  const a = -Math.PI / 2 + (i * Math.PI * 2) / STYLE.length
  return [Math.cos(a) * r, Math.sin(a) * r]
}

function polygon(r: (i: number) => number) {
  return STYLE.map((_, i) => radarPoint(i, r(i)).map((v) => v.toFixed(3)).join(",")).join(" ")
}

const WEAR_LINE = WEAR.map((v, m) => {
  const x = (m / MATCH_MINUTES) * 100
  const y = 36 - v * 30
  return `${m === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`
}).join(" ")

function Radar({ nodes, size }: { nodes: PanelNodes; size: number }) {
  return (
    <svg width={size} height={size} viewBox="-1.62 -1.62 3.24 3.24" className="mx-auto block" aria-hidden="true">
      {[0.33, 0.66, 1].map((r) => (
        <polygon
          key={r}
          points={polygon(() => r)}
          fill="none"
          stroke={GRID}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {STYLE.map((_, i) => {
        const [x, y] = radarPoint(i, 1)
        return <line key={i} x1={0} y1={0} x2={x} y2={y} stroke={GRID} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      })}
      <g ref={(el) => setNode(nodes, "cardRadar", el)}>
        <polygon
          points={polygon((i) => STYLE[i].value)}
          fill="rgba(207, 210, 214, 0.1)"
          stroke={VIBO_COLORS.platinum}
          strokeWidth={1.15}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {STYLE.map((axis, i) => {
          const [x, y] = radarPoint(i, axis.value)
          return <circle key={axis.label} cx={x} cy={y} r={0.038} fill={VIBO_COLORS.platinumLight} />
        })}
      </g>
      {STYLE.map((axis, i) => {
        const [x, y] = radarPoint(i, 1.22)
        return (
          <text
            key={axis.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={0.13}
            fill={MUTED}
            fontFamily="Poppins, sans-serif"
          >
            {axis.label}
          </text>
        )
      })}
    </svg>
  )
}

function Heatmap({ width }: { width: number }) {
  const w = 80
  const h = 100
  const bands = [
    { y: 10, label: "Red" },
    { y: 44, label: "Medio" },
    { y: 80, label: "Fondo" },
  ]
  return (
    <svg width={width} height={(width * h) / w} viewBox={`0 0 ${w} ${h}`} className="block" aria-hidden="true">
      <defs>
        <filter id="vibo-heat-blur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={3.2} />
        </filter>
        <clipPath id="vibo-heat-court">
          <rect width={w} height={h} />
        </clipPath>
      </defs>
      <rect width={w} height={h} fill="#152033" />
      <g clipPath="url(#vibo-heat-court)" filter="url(#vibo-heat-blur)">
        {HEAT_BLOBS.map((blob, i) => (
          <circle
            key={i}
            cx={blob.x}
            cy={blob.y}
            r={blob.r}
            fill={blob.tone === "light" ? "#f2f4f6" : "#6eb4ff"}
            opacity={Math.min(1, blob.w + 0.15)}
          />
        ))}
      </g>
      <g fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeWidth={0.7} vectorEffect="non-scaling-stroke">
        <rect x={0.4} y={0.4} width={w - 0.8} height={h - 0.8} />
        <line x1={w / 2} y1={0} x2={w / 2} y2={h} />
        <line x1={0} y1={h / 3} x2={w} y2={h / 3} />
        <line x1={0} y1={(h * 2) / 3} x2={w} y2={(h * 2) / 3} />
      </g>
      <line x1={0} y1={0.7} x2={w} y2={0.7} stroke="rgba(255,255,255,0.4)" strokeWidth={1.1} vectorEffect="non-scaling-stroke" />
      {bands.map((band) => (
        <text
          key={band.label}
          x={w / 2}
          y={band.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={6.2}
          letterSpacing={0.9}
          fill="rgba(255,255,255,0.55)"
          fontFamily="Poppins, sans-serif"
        >
          {band.label.toUpperCase()}
        </text>
      ))}
    </svg>
  )
}

function Wear({ nodes, compact }: { nodes: PanelNodes; compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className={`block w-full ${compact ? "h-16" : "h-[7.5rem]"}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="vibo-wear-reveal">
          <rect ref={(el) => setNode(nodes, "cardWear", el)} x={0} y={0} width={0} height={40} />
        </clipPath>
        <linearGradient id="vibo-wear-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={VIBO_COLORS.platinum} stopOpacity={0.28} />
          <stop offset="1" stopColor={VIBO_COLORS.platinum} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath="url(#vibo-wear-reveal)">
        <path d={`${WEAR_LINE} L100,40 L0,40 Z`} fill="url(#vibo-wear-fill)" />
        <path d={WEAR_LINE} fill="none" stroke={VIBO_COLORS.platinum} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  )
}

/** Tarjeta de resultado: estilo, zonas y desgaste de un partido de 60 min. */
export function MatchCard({ nodes, isMobile }: { nodes: PanelNodes; isMobile: boolean }) {
  return (
    <div
      ref={(el) => setNode(nodes, "card", el)}
      aria-label={`Lectura del partido del ${PLAYER.name}`}
      role="group"
      className="absolute rounded-lg backdrop-blur-md"
      style={{
        fontFamily: "Poppins, sans-serif",
        ...(isMobile
          ? { left: 12, right: 12, bottom: 88, padding: 12 }
          : {
              right: "clamp(1rem, 4vw, 3.5rem)",
              top: "calc(50% + 28px)",
              transform: "translateY(-50%)",
              width: 392,
              padding: 22,
            }),
        opacity: 0,
        visibility: "hidden",
        background: theme.surface,
        border: "1px solid rgba(207, 210, 214, 0.16)",
        color: theme.text,
      }}
    >
      <div className={`flex items-center justify-between ${LABEL}`} style={{ color: MUTED }}>
        <span>Vibo · {PLAYER.name}</span>
        <span>{MATCH_MINUTES} min</span>
      </div>
      <h3 className="mt-1.5 text-[17px] leading-tight font-semibold tracking-tight">Tu lectura del partido</h3>
      <p className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
        {PLAYER.hand} · {PLAYER.tags.join(" · ")}
      </p>

      <div className={`mt-4 mb-2 text-center ${LABEL}`} style={{ color: MUTED }}>
        Estilo
      </div>
      <Radar nodes={nodes} size={isMobile ? 132 : 220} />

      <div className="mt-4 grid grid-cols-2 gap-5 border-t pt-3.5" style={{ borderColor: GRID }}>
        <div>
          <div className={`mb-2 ${LABEL}`} style={{ color: MUTED }}>
            Zonas
          </div>
          <Heatmap width={isMobile ? 108 : 148} />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className={LABEL} style={{ color: MUTED }}>
              Desgaste
            </span>
            <span className="font-mono text-[11px]" style={{ fontVariantNumeric: "tabular-nums" }}>
              −{WEAR_DROP}%
            </span>
          </div>
          <Wear nodes={nodes} compact={isMobile} />
          <div
            className="mt-1 flex justify-between font-mono text-[9px]"
            style={{ color: MUTED, fontVariantNumeric: "tabular-nums" }}
          >
            <span>0′</span>
            <span>60′</span>
          </div>
        </div>
      </div>
    </div>
  )
}
