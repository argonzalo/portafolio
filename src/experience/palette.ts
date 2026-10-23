import { Color, MathUtils } from "three"
import { handoffStart, ease } from "@/experience/choreography"

import { journeyChapters } from "@/components/journey/chapters"
import type { ExperienceStore } from "@/experience/store"
import type { ScenePalette } from "@/experience/types"
import { getSceneByChapter } from "@/scenes/registry"

/**
 * Paletas por capítulo (T-A15 / `03-escenas.md` §6).
 *
 * Lee el store (capítulo + progreso) y:
 * 1. Interpola CSS variables del DOM hacia la paleta entrante.
 * 2. Cambia a tema claro en Naturalis (`scheme: "light"`).
 * 3. Expone el color vivo para que el canvas se pinte al unísono (`Stage`).
 *
 * Sin `setState` por frame: un rAF escribe las variables CSS.
 */

/** Paleta del sitio fuera de escenas 3D (hero, manifiesto, archivo, cierre). */
export const SITE_PALETTE: ScenePalette = {
  background: "#0a0a0b",
  foreground: "#f4f7f7",
  accent: "#6b6fd4",
  accentAlt: "#a8a3d9",
  scheme: "dark",
}

export type LivePalette = {
  background: string
  foreground: string
  accent: string
  accentAlt: string
  scheme: "dark" | "light"
}

const live: LivePalette = {
  background: SITE_PALETTE.background,
  foreground: SITE_PALETTE.foreground,
  accent: SITE_PALETTE.accent,
  accentAlt: SITE_PALETTE.accentAlt ?? SITE_PALETTE.accent,
  scheme: SITE_PALETTE.scheme,
}

const scratchA = new Color()
const scratchB = new Color()
const scratchOut = new Color()

const chapterOrder = journeyChapters.map((chapter) => chapter.id)

let lastCssKey = ""
let boundRoot: HTMLElement | null = null

export function getLivePalette(): Readonly<LivePalette> {
  return live
}

export function paletteForChapter(chapterId: string | null): ScenePalette {
  if (!chapterId) {
    return SITE_PALETTE
  }

  const scene = getSceneByChapter(chapterId)
  if (scene) {
    return scene.palette
  }

  return SITE_PALETTE
}

function accentAltOf(palette: ScenePalette): string {
  return palette.accentAlt ?? palette.accent
}

function lerpHex(from: string, to: string, t: number): string {
  scratchA.set(from)
  scratchB.set(to)
  scratchOut.copy(scratchA).lerp(scratchB, t)
  return `#${scratchOut.getHexString()}`
}

function contrastingInk(hex: string): string {
  scratchA.set(hex)
  const luminance =
    0.2126 * scratchA.r + 0.7152 * scratchA.g + 0.0722 * scratchA.b
  return luminance > 0.55 ? "#0a0a0b" : "#ffffff"
}

function mixPalettes(
  from: ScenePalette,
  to: ScenePalette,
  t: number,
  reducedMotion: boolean
): LivePalette {
  const amount = reducedMotion ? (t < 0.5 ? 0 : 1) : ease(t)
  const scheme =
    from.scheme === to.scheme
      ? from.scheme
      : amount < 0.5
        ? from.scheme
        : to.scheme

  return {
    background: lerpHex(from.background, to.background, amount),
    foreground: lerpHex(from.foreground, to.foreground, amount),
    accent: lerpHex(from.accent, to.accent, amount),
    accentAlt: lerpHex(accentAltOf(from), accentAltOf(to), amount),
    scheme,
  }
}

function blendAmount(progress: number, chapterId: string): number {
  const start = handoffStart(chapterId)
  if (progress <= start) {
    return 0
  }

  return MathUtils.clamp((progress - start) / (1 - start), 0, 1)
}

function nextChapterId(chapterId: string): string | null {
  const index = chapterOrder.indexOf(chapterId)
  if (index < 0 || index >= chapterOrder.length - 1) {
    return null
  }

  return chapterOrder[index + 1] ?? null
}

function resolveLive(store: ExperienceStore): LivePalette {
  const { chapterId, reducedMotion } = store.getSnapshot()
  const current = paletteForChapter(chapterId)

  if (!chapterId) {
    return {
      background: current.background,
      foreground: current.foreground,
      accent: current.accent,
      accentAlt: accentAltOf(current),
      scheme: current.scheme,
    }
  }

  const progress = store.progress(chapterId).current
  const nextId = nextChapterId(chapterId)
  const amount = blendAmount(progress, chapterId)

  if (!nextId || amount <= 0) {
    return {
      background: current.background,
      foreground: current.foreground,
      accent: current.accent,
      accentAlt: accentAltOf(current),
      scheme: current.scheme,
    }
  }

  // Darken the room before the incoming displays appear, avoiding a grey wash.
  const paletteAmount =
    chapterId === "naturalis" && nextId === "banner-2"
      ? Math.min(1, amount / 0.65)
      : amount
  return mixPalettes(
    current,
    paletteForChapter(nextId),
    paletteAmount,
    reducedMotion
  )
}

function applyCss(palette: LivePalette): void {
  const root = boundRoot ?? document.documentElement
  const body = document.body
  const key = `${palette.background}|${palette.foreground}|${palette.accent}|${palette.accentAlt}|${palette.scheme}`

  if (key === lastCssKey) {
    return
  }

  lastCssKey = key

  const primaryForeground = contrastingInk(palette.accent)
  const muted = lerpHex(palette.background, palette.foreground, 0.35)
  const border = lerpHex(palette.background, palette.foreground, 0.18)
  const card = lerpHex(palette.background, palette.foreground, 0.06)

  root.style.setProperty("--journey-background", palette.background)
  root.style.setProperty("--journey-foreground", palette.foreground)
  root.style.setProperty("--journey-accent", palette.accent)
  root.style.setProperty("--journey-accent-alt", palette.accentAlt)

  root.style.setProperty("--background", palette.background)
  root.style.setProperty("--foreground", palette.foreground)
  root.style.setProperty("--primary", palette.accent)
  root.style.setProperty("--primary-foreground", primaryForeground)
  root.style.setProperty("--primary-soft", palette.accentAlt)
  root.style.setProperty(
    "--primary-hard",
    lerpHex(palette.accent, "#000000", 0.35)
  )
  root.style.setProperty(
    "--accent",
    lerpHex(palette.background, palette.accent, 0.22)
  )
  root.style.setProperty("--accent-foreground", palette.foreground)
  root.style.setProperty("--muted", muted)
  root.style.setProperty(
    "--muted-foreground",
    lerpHex(palette.foreground, palette.background, 0.35)
  )
  root.style.setProperty("--card", card)
  root.style.setProperty("--card-foreground", palette.foreground)
  root.style.setProperty("--popover", card)
  root.style.setProperty("--popover-foreground", palette.foreground)
  root.style.setProperty("--secondary", card)
  root.style.setProperty("--secondary-foreground", palette.foreground)
  root.style.setProperty("--border", border)
  root.style.setProperty("--input", border)
  root.style.setProperty("--ring", palette.accent)
  root.style.setProperty("--sidebar", card)
  root.style.setProperty("--sidebar-foreground", palette.foreground)
  root.style.setProperty("--sidebar-primary", palette.accent)
  root.style.setProperty("--sidebar-primary-foreground", primaryForeground)
  root.style.setProperty("--sidebar-accent", muted)
  root.style.setProperty("--sidebar-accent-foreground", palette.foreground)
  root.style.setProperty("--sidebar-border", border)
  root.style.setProperty("--sidebar-ring", palette.accent)

  root.dataset.paletteScheme = palette.scheme
  root.style.colorScheme = palette.scheme
  body.classList.toggle("dark", palette.scheme === "dark")
}

function writeLive(palette: LivePalette): void {
  live.background = palette.background
  live.foreground = palette.foreground
  live.accent = palette.accent
  live.accentAlt = palette.accentAlt
  live.scheme = palette.scheme
}

/** Aplica la paleta una vez (tests, deep links, primer paint). */
export function applyPaletteNow(store: ExperienceStore): LivePalette {
  const next = resolveLive(store)
  writeLive(next)
  if (typeof document !== "undefined") {
    applyCss(next)
  }
  return next
}

/**
 * Enlaza el store al DOM. Idempotente respecto del rAF: devolver el cleanup
 * cancela el loop. Integración mínima desde `Stage` (mismo patrón que T-A13).
 */
export function mountPalette(store: ExperienceStore): () => void {
  boundRoot = document.documentElement
  boundRoot.dataset.paletteBound = ""
  lastCssKey = ""
  applyPaletteNow(store)

  let frame = 0
  const tick = () => {
    if (!document.hidden) {
      applyPaletteNow(store)
    }
    frame = requestAnimationFrame(tick)
  }

  frame = requestAnimationFrame(tick)

  return () => {
    cancelAnimationFrame(frame)
    if (boundRoot) {
      delete boundRoot.dataset.paletteBound
      delete boundRoot.dataset.paletteScheme
      boundRoot.style.colorScheme = ""
      const keys = [
        "--journey-background",
        "--journey-foreground",
        "--journey-accent",
        "--journey-accent-alt",
        "--background",
        "--foreground",
        "--primary",
        "--primary-foreground",
        "--primary-soft",
        "--primary-hard",
        "--accent",
        "--accent-foreground",
        "--muted",
        "--muted-foreground",
        "--card",
        "--card-foreground",
        "--popover",
        "--popover-foreground",
        "--secondary",
        "--secondary-foreground",
        "--border",
        "--input",
        "--ring",
        "--sidebar",
        "--sidebar-foreground",
        "--sidebar-primary",
        "--sidebar-primary-foreground",
        "--sidebar-accent",
        "--sidebar-accent-foreground",
        "--sidebar-border",
        "--sidebar-ring",
      ]
      for (const key of keys) {
        boundRoot.style.removeProperty(key)
      }
    }
    boundRoot = null
    lastCssKey = ""
    document.body.classList.add("dark")
  }
}
