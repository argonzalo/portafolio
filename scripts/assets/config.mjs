/**
 * Convención del pipeline de assets (`01-arquitectura.md` §7, `02` §2, ADR-010).
 *
 * Salida: public/models/<escena>/<nombre>.<nivel>.glb
 * Fuentes: assets-src/<escena>/…/*.glb|gltf (gitignored salvo README)
 */

/** @typedef {'high' | 'medium' | 'low'} QualityLevel */

/**
 * Presupuestos de peso por escena (`02-rendimiento-y-mobile.md` §2), en KiB.
 * `high` se mide contra desktop; `medium` y `low` contra mobile.
 */
export const TIER_BUDGETS_KB = {
  1: { desktop: 1536, mobile: 600 },
  2: { desktop: 400, mobile: 200 },
  3: { desktop: 0, mobile: 0 },
}

/** Escenas conocidas → línea del portafolio. El resto asume primera línea. */
export const SCENE_TIERS = {
  vibo: 1,
  pirp: 1,
  naturalis: 1,
  banner: 1,
  "banner-2": 1,
  kit: 1,
  "app-etiquetas": 2,
  "web-landing": 2,
  starbene: 2,
  agnt: 2,
  "cielo-y-mar": 2,
  "venta-duplex": 2,
  "arcor-demo": 3,
  forme: 3,
  "agro-ia-tesis": 3,
  teams: 3,
}

/**
 * Parámetros de gltf-transform optimize por nivel de calidad.
 * Texturas: KTX2 (requiere `toktx` de KTX-Software en el PATH).
 *
 * @type {Record<QualityLevel, {
 *   textureSize: number
 *   simplifyRatio: number
 *   simplifyError: number
 *   meshoptLevel: 'medium' | 'high'
 *   simplify: boolean
 * }>}
 */
export const LEVEL_OPTS = {
  high: {
    textureSize: 2048,
    simplify: false,
    simplifyRatio: 1,
    simplifyError: 0.0001,
    meshoptLevel: "high",
  },
  medium: {
    textureSize: 1024,
    simplify: true,
    simplifyRatio: 0.5,
    simplifyError: 0.001,
    meshoptLevel: "high",
  },
  low: {
    textureSize: 512,
    simplify: true,
    simplifyRatio: 0.25,
    simplifyError: 0.01,
    meshoptLevel: "medium",
  },
}

export const QUALITY_LEVELS = /** @type {const} */ (["high", "medium", "low"])

export const SOURCE_EXTENSIONS = new Set([".glb", ".gltf"])

/** Sufijo de salida: modelo.high.glb */
export const LEVEL_SUFFIX_RE = /\.(high|medium|low)\.glb$/i

/**
 * @param {string} sceneId
 * @returns {1 | 2 | 3}
 */
export function sceneTier(sceneId) {
  return SCENE_TIERS[sceneId] ?? 1
}

/**
 * @param {1 | 2 | 3} tier
 * @param {QualityLevel} level
 */
export function budgetKbFor(tier, level) {
  const budgets = TIER_BUDGETS_KB[tier]
  return level === "high" ? budgets.desktop : budgets.mobile
}
