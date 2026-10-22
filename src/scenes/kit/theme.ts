export type KitPresetId = "vibo" | "pirp" | "naturalis" | "banner"

export type KitTheme = {
  id: KitPresetId
  label: string
  tagline: string
  scheme: "dark" | "light"
  background: string
  backgroundAlt: string
  surface: string
  surfaceElevated: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  primary: string
  accent: string
  positive: string
  warning: string
  danger: string
  gridColor: string
  glowColor: string
}

export const KIT_LAB_BEATS = [
  {
    id: "mundo",
    range: [0, 0.22] as [number, number],
    progress: 0.12,
    label: "01 · Rig de cámara + Líneas del hilo",
  },
  {
    id: "razonamiento",
    range: [0.22, 0.44] as [number, number],
    progress: 0.33,
    label: "02 · HUD 3D + Pose y Bounding Box",
  },
  {
    id: "grafo",
    range: [0.44, 0.66] as [number, number],
    progress: 0.55,
    label: "03 · Grafo de nodos y decisiones",
  },
  {
    id: "tendencia",
    range: [0.66, 0.84] as [number, number],
    progress: 0.75,
    label: "04 · Curva en vivo + Alerta y barras",
  },
  {
    id: "resultado",
    range: [0.84, 1.0] as [number, number],
    progress: 0.92,
    label: "05 · Contadores + Síntesis multi-escena",
  },
] as const

/**
 * Tokens visuales de producto para el kit de escena (T-A18).
 * Derivados de las paletas validadas en `03-escenas.md` y `assets-src/<id>/brand/palette.json`.
 */
export const KIT_THEMES: Readonly<Record<KitPresetId, KitTheme>> = {
  vibo: {
    id: "vibo",
    label: "Vibo · Broadcast Replay",
    tagline: "Visión artificial aplicada al deporte en cámara lenta",
    scheme: "dark",
    background: "#061121",
    backgroundAlt: "#0b1d36",
    surface: "rgba(7, 21, 46, 0.84)",
    surfaceElevated: "rgba(12, 31, 64, 0.92)",
    border: "rgba(61, 139, 255, 0.34)",
    borderStrong: "rgba(245, 196, 81, 0.72)",
    text: "#F1F5F9",
    textMuted: "#9FB3C8",
    primary: "#3D8BFF",
    accent: "#F5C451",
    positive: "#38BDF8",
    warning: "#F5C451",
    danger: "#F87171",
    gridColor: "#16355C",
    glowColor: "rgba(61, 139, 255, 0.32)",
  },
  pirp: {
    id: "pirp",
    label: "Pirp · Tiempo Real",
    tagline: "Señal, clasificación semántica y lectura de reputación",
    scheme: "dark",
    background: "#17181A",
    backgroundAlt: "#20191C",
    surface: "rgba(28, 28, 31, 0.88)",
    surfaceElevated: "rgba(38, 34, 36, 0.94)",
    border: "rgba(168, 67, 79, 0.38)",
    borderStrong: "rgba(239, 233, 221, 0.68)",
    text: "#EFE9DD",
    textMuted: "#A59E94",
    primary: "#A8434F",
    accent: "#EFE9DD",
    positive: "#6F9C88",
    warning: "#D4A359",
    danger: "#CF6975",
    gridColor: "#2C2628",
    glowColor: "rgba(168, 67, 79, 0.30)",
  },
  naturalis: {
    id: "naturalis",
    label: "Naturalis · Calma Clínica",
    tagline: "Tema claro: agenda automatizada mientras el equipo atiende",
    scheme: "light",
    background: "#F4F9F7",
    backgroundAlt: "#E4F0EC",
    surface: "rgba(255, 255, 255, 0.90)",
    surfaceElevated: "rgba(246, 251, 249, 0.96)",
    border: "rgba(86, 133, 125, 0.28)",
    borderStrong: "rgba(43, 79, 73, 0.62)",
    text: "#192321",
    textMuted: "#4A6360",
    primary: "#56857D",
    accent: "#2B4F49",
    positive: "#3E7B6E",
    warning: "#B07D4F",
    danger: "#B85D53",
    gridColor: "#CBE0DC",
    glowColor: "rgba(86, 133, 125, 0.22)",
  },
  banner: {
    id: "banner",
    label: "Banner 2.0 · Sala de Control",
    tagline: "Orquestación de plantillas y colas hacia 10.000 pantallas",
    scheme: "dark",
    background: "#141110",
    backgroundAlt: "#211815",
    surface: "rgba(26, 21, 19, 0.88)",
    surfaceElevated: "rgba(38, 29, 26, 0.94)",
    border: "rgba(255, 181, 160, 0.30)",
    borderStrong: "rgba(218, 62, 0, 0.78)",
    text: "#EDE0DD",
    textMuted: "#B8A29C",
    primary: "#DA3E00",
    accent: "#FFB5A0",
    positive: "#F59E0B",
    warning: "#FFB5A0",
    danger: "#EF4444",
    gridColor: "#33241F",
    glowColor: "rgba(218, 62, 0, 0.32)",
  },
}

export function getKitTheme(preset?: KitPresetId | string | null): KitTheme {
  if (preset && preset in KIT_THEMES) {
    return KIT_THEMES[preset as KitPresetId]
  }
  return KIT_THEMES.vibo
}
