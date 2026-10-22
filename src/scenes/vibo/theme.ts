import { KIT_THEMES, type KitTheme } from "@/scenes/kit"

/** Azul eléctrico de la escena y acento platino casi gris (sin dorado). */
export const VIBO_COLORS = {
  blue: "#1f7aff",
  blueSoft: "rgba(31, 122, 255, 0.16)",
  platinum: "#cfd2d6",
  platinumLight: "#eceef0",
  ink: "#071426",
} as const

export const VIBO_THEME: KitTheme = {
  ...KIT_THEMES.vibo,
  border: "rgba(31, 122, 255, 0.36)",
  borderStrong: "rgba(207, 210, 214, 0.7)",
  primary: VIBO_COLORS.blue,
  accent: VIBO_COLORS.platinum,
  positive: "#4aa3ff",
  warning: VIBO_COLORS.platinum,
  gridColor: "#12325f",
  glowColor: "rgba(31, 122, 255, 0.34)",
}

/** Variante de la tarjeta de resultado: marco y datos en platino. */
export const PLATINUM_THEME: KitTheme = {
  ...VIBO_THEME,
  border: "rgba(207, 210, 214, 0.26)",
  borderStrong: "rgba(207, 210, 214, 0.6)",
  primary: VIBO_COLORS.platinum,
  accent: VIBO_COLORS.platinumLight,
  glowColor: "rgba(207, 210, 214, 0.14)",
}
