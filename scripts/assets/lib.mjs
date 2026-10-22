import { readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  LEVEL_SUFFIX_RE,
  SOURCE_EXTENSIONS,
  sceneTier,
  budgetKbFor,
} from "./config.mjs"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

export const PATHS = {
  root: ROOT,
  assetsSrc: path.join(ROOT, "assets-src"),
  modelsOut: path.join(ROOT, "public", "models"),
  texturesOut: path.join(ROOT, "public", "textures"),
  cli: path.join(ROOT, "node_modules", "@gltf-transform", "cli", "bin", "cli.js"),
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
export async function walkFiles(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return []
    }
    throw err
  }

  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)))
      continue
    }
    if (entry.isFile()) files.push(full)
  }
  return files
}

/**
 * Fuentes en assets-src/<escena>/… (ignora README y pipeline.json).
 *
 * @returns {Promise<{ sceneId: string, sourcePath: string, baseName: string }[]>}
 */
export async function discoverSources() {
  const files = await walkFiles(PATHS.assetsSrc)
  const sources = []

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!SOURCE_EXTENSIONS.has(ext)) continue

    const rel = path.relative(PATHS.assetsSrc, file)
    const parts = rel.split(path.sep)
    if (parts.length < 2) {
      console.warn(
        `[assets] ignorado (debe vivir en assets-src/<escena>/): ${rel}`
      )
      continue
    }

    const sceneId = parts[0]
    const baseName = path.basename(file, ext)
    sources.push({ sceneId, sourcePath: file, baseName })
  }

  return sources
}

/**
 * @param {string} sceneId
 * @param {string} baseName
 * @param {import('./config.mjs').QualityLevel} level
 */
export function outputModelPath(sceneId, baseName, level) {
  return path.join(PATHS.modelsOut, sceneId, `${baseName}.${level}.glb`)
}

/**
 * Agrupa salidas optimizadas por escena y nivel.
 *
 * @returns {Promise<Map<string, Map<import('./config.mjs').QualityLevel, { path: string, bytes: number }[]>>>}
 */
export async function discoverOutputs() {
  const files = await walkFiles(PATHS.modelsOut)
  /** @type {Map<string, Map<import('./config.mjs').QualityLevel, { path: string, bytes: number }[]>>} */
  const byScene = new Map()

  for (const file of files) {
    if (path.extname(file).toLowerCase() !== ".glb") continue
    const rel = path.relative(PATHS.modelsOut, file)
    const parts = rel.split(path.sep)
    if (parts.length < 2) continue

    const sceneId = parts[0]
    const name = parts[parts.length - 1]
    const match = name.match(LEVEL_SUFFIX_RE)
    if (!match) continue

    const level = /** @type {import('./config.mjs').QualityLevel} */ (
      match[1].toLowerCase()
    )
    const { size } = await stat(file)

    if (!byScene.has(sceneId)) byScene.set(sceneId, new Map())
    const byLevel = byScene.get(sceneId)
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level).push({ path: file, bytes: size })
  }

  // Texturas sueltas en public/textures/<escena>/ cuentan para el mismo presupuesto.
  const textureFiles = await walkFiles(PATHS.texturesOut)
  for (const file of textureFiles) {
    const rel = path.relative(PATHS.texturesOut, file)
    const parts = rel.split(path.sep)
    if (parts.length < 2) continue
    const sceneId = parts[0]
    const { size } = await stat(file)
    // Se imputan a high/medium/low según el nombre si trae sufijo; si no, a high.
    const name = parts[parts.length - 1]
    const match = name.match(/\.(high|medium|low)\./i)
    const level = /** @type {import('./config.mjs').QualityLevel} */ (
      match ? match[1].toLowerCase() : "high"
    )

    if (!byScene.has(sceneId)) byScene.set(sceneId, new Map())
    const byLevel = byScene.get(sceneId)
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level).push({ path: file, bytes: size })
  }

  return byScene
}

/**
 * @param {Map<string, Map<import('./config.mjs').QualityLevel, { path: string, bytes: number }[]>>} byScene
 * @returns {{ ok: boolean, rows: { sceneId: string, level: string, kb: number, budgetKb: number, ok: boolean }[] }}
 */
export function evaluateBudgets(byScene) {
  /** @type {{ sceneId: string, level: string, kb: number, budgetKb: number, ok: boolean }[]} */
  const rows = []

  for (const [sceneId, byLevel] of byScene) {
    const tier = sceneTier(sceneId)
    for (const [level, files] of byLevel) {
      const bytes = files.reduce((sum, f) => sum + f.bytes, 0)
      const kb = Math.ceil(bytes / 1024)
      const budgetKb = budgetKbFor(tier, level)
      rows.push({
        sceneId,
        level,
        kb,
        budgetKb,
        ok: kb <= budgetKb,
      })
    }
  }

  rows.sort((a, b) =>
    a.sceneId === b.sceneId
      ? a.level.localeCompare(b.level)
      : a.sceneId.localeCompare(b.sceneId)
  )

  return { ok: rows.every((r) => r.ok), rows }
}

/**
 * @param {number} bytes
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KiB`
  return `${(kb / 1024).toFixed(2)} MiB`
}
