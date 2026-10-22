/**
 * Especificaciones físicas del kit de dispositivos (T-A19).
 *
 * Escala del kit: **1 unidad = 10 cm**. Las proporciones salen de hardware real
 * (teléfono de 6,1", laptop de 14", monitor de 27") para que los dispositivos
 * no se lean como juguetes: grosores finos, biseles mínimos y radios correctos.
 */

import type { QualityTier } from "@/experience/types"

/** Escalar que puede animarse sin re-render: número fijo, getter o ref mutable. */
export type DynamicScalar = number | (() => number) | { readonly current: number }

export function resolveScalar(value: DynamicScalar | undefined, fallback: number): number {
  if (value === undefined) return fallback
  if (typeof value === "number") return value
  if (typeof value === "function") return value()
  return value.current
}

export type RenderTier = Exclude<QualityTier, "static">

export function toRenderTier(quality: QualityTier): RenderTier {
  return quality === "static" ? "low" : quality
}

/** Teléfono de 6,1" (≈ 70,6 × 146,6 × 8,25 mm). */
export const PHONE_SPEC = {
  width: 0.706,
  height: 1.466,
  depth: 0.0825,
  radius: 0.112,
  /** Borde entre el marco metálico y el vidrio frontal. */
  bevel: 0.011,
  /** Bisel negro alrededor de la pantalla. */
  bezel: 0.017,
  screenRadius: 0.094,
  island: { width: 0.124, height: 0.036, top: 0.03 },
  cameraModule: { size: 0.33, radius: 0.07, inset: 0.038, height: 0.011 },
} as const

/** Laptop de 14" (≈ 312,6 × 221,2 mm; base 9,5 mm; tapa 6 mm). */
export const LAPTOP_SPEC = {
  width: 3.126,
  depth: 2.212,
  baseThickness: 0.095,
  lidThickness: 0.058,
  radius: 0.12,
  bevel: 0.022,
  /** Bisel lateral/superior de la pantalla. */
  bezel: 0.07,
  /** Barbilla inferior (más gruesa que el bisel): deja la pantalla en ≈ 1,54:1. */
  chin: 0.19,
  screenRadius: 0.05,
  notch: { width: 0.32, height: 0.066 },
  /** Ángulo de la tapa (rad) respecto a la vertical cuando `open = 1`. */
  openTilt: 0.3,
  keyboard: { width: 2.72, depth: 1.12, inset: 0.19, unit: 0.1876, gap: 0.0216 },
  trackpad: { width: 1.36, depth: 0.86, inset: 0.11, radius: 0.045 },
} as const

/** Monitor de 27" tipo estudio (≈ 623 × 362 × 22 mm) y cartelería digital. */
export const DISPLAY_SPEC = {
  width: 6.23,
  height: 3.62,
  depth: 0.22,
  radius: 0.07,
  bevel: 0.03,
  bezel: 0.12,
  screenRadius: 0.025,
  /** Altura del borde inferior del panel sobre la mesa con el pie `studio`. */
  standLift: 1.0,
  foot: { width: 1.25, depth: 1.9, thickness: 0.06 },
  arm: { width: 1.1, thickness: 0.075 },
  signage: { depth: 0.12, bezel: 0.045, radius: 0.03 },
} as const

export type DeviceFinish = "space-black" | "silver" | "graphite" | "midnight" | "titanium"

export type DeviceFinishSpec = {
  label: string
  /** Aluminio / titanio del cuerpo. */
  body: string
  bodyRoughness: number
  /** Vidrio esmerilado trasero o panel trasero (teléfono). */
  back: string
  backRoughness: number
  /** Teclas y bisagras. */
  trim: string
}

export const DEVICE_FINISHES: Readonly<Record<DeviceFinish, DeviceFinishSpec>> = {
  "space-black": {
    label: "Negro espacial",
    body: "#2e3034",
    bodyRoughness: 0.4,
    back: "#25272b",
    backRoughness: 0.62,
    trim: "#17181a",
  },
  silver: {
    label: "Plata",
    body: "#d3d6db",
    bodyRoughness: 0.34,
    back: "#e2e4e8",
    backRoughness: 0.6,
    trim: "#1a1b1d",
  },
  graphite: {
    label: "Grafito",
    body: "#55575c",
    bodyRoughness: 0.36,
    back: "#46484d",
    backRoughness: 0.6,
    trim: "#151618",
  },
  midnight: {
    label: "Medianoche",
    body: "#232a36",
    bodyRoughness: 0.38,
    back: "#1f2531",
    backRoughness: 0.6,
    trim: "#121418",
  },
  titanium: {
    label: "Titanio natural",
    body: "#8f8b84",
    bodyRoughness: 0.44,
    back: "#a29d95",
    backRoughness: 0.64,
    trim: "#1c1c1c",
  },
}

export const DEVICE_FINISH_IDS = Object.keys(DEVICE_FINISHES) as DeviceFinish[]

/** Área útil de pantalla del teléfono (unidades del kit). */
export const PHONE_SCREEN = {
  width: PHONE_SPEC.width - (PHONE_SPEC.bevel + PHONE_SPEC.bezel) * 2,
  height: PHONE_SPEC.height - (PHONE_SPEC.bevel + PHONE_SPEC.bezel) * 2,
} as const

const LAPTOP_LID_HEIGHT =
  LAPTOP_SPEC.depth - LAPTOP_SPEC.lidThickness / 2 - 0.006

/** Área útil de pantalla de la laptop (unidades del kit). */
export const LAPTOP_SCREEN = {
  width: LAPTOP_SPEC.width - LAPTOP_SPEC.bezel * 2,
  height: LAPTOP_LID_HEIGHT - LAPTOP_SPEC.bezel - LAPTOP_SPEC.chin,
} as const

/** Área útil de pantalla del display según variante/orientación. */
export function getDisplayScreenSize(
  variant: "monitor" | "signage",
  orientation: "landscape" | "portrait" = "landscape"
): { width: number; height: number } {
  const bezel = variant === "signage" ? DISPLAY_SPEC.signage.bezel : DISPLAY_SPEC.bezel
  const width = DISPLAY_SPEC.width - bezel * 2
  const height = DISPLAY_SPEC.height - bezel * 2
  return orientation === "portrait"
    ? { width: height, height: width }
    : { width, height }
}
