#!/usr/bin/env node
/**
 * npm run assets:build
 *
 * assets-src/<escena>/*.glb|gltf
 *   → public/models/<escena>/<nombre>.{high,medium,low}.glb
 *
 * Usa @gltf-transform/cli optimize: dedup/prune/weld/simplify + meshopt + KTX2.
 * KTX2 requiere `toktx` (KTX-Software) en el PATH.
 * Override de emergencia: ASSETS_TEXTURE_COMPRESS=webp|avif|auto|false
 */

import { spawnSync, execSync } from "node:child_process"
import { mkdir } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import { LEVEL_OPTS, QUALITY_LEVELS } from "./config.mjs"
import {
  PATHS,
  discoverSources,
  outputModelPath,
  formatBytes,
} from "./lib.mjs"
import { evaluateBudgets, discoverOutputs } from "./lib.mjs"

function hasToktx() {
  try {
    execSync("toktx --version", { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

function textureCompressFlag() {
  const override = process.env.ASSETS_TEXTURE_COMPRESS
  if (override !== undefined && override !== "") {
    return override
  }
  return "ktx2"
}

/**
 * @param {string[]} args
 */
function runGltfTransform(args) {
  const result = spawnSync(process.execPath, [PATHS.cli, ...args], {
    stdio: "inherit",
    cwd: PATHS.root,
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`gltf-transform falló (${result.status}): ${args.join(" ")}`)
  }
}

/**
 * @param {string} input
 * @param {string} output
 * @param {import('./config.mjs').QualityLevel} level
 * @param {string} textureCompress
 */
function optimizeLevel(input, output, level, textureCompress) {
  const opts = LEVEL_OPTS[level]
  /** @type {string[]} */
  const args = [
    "optimize",
    input,
    output,
    "--compress",
    "meshopt",
    "--meshopt-level",
    opts.meshoptLevel,
    "--texture-size",
    String(opts.textureSize),
    "--texture-compress",
    textureCompress,
    "--weld",
    "true",
    "--prune",
    "true",
  ]

  if (opts.simplify) {
    args.push(
      "--simplify",
      "true",
      "--simplify-ratio",
      String(opts.simplifyRatio),
      "--simplify-error",
      String(opts.simplifyError)
    )
  } else {
    args.push("--simplify", "false")
  }

  runGltfTransform(args)
}

async function main() {
  const sources = await discoverSources()
  const textureCompress = textureCompressFlag()

  if (sources.length === 0) {
    console.log(
      "[assets:build] no hay fuentes en assets-src/<escena>/ — nada que procesar."
    )
  } else {
    if (textureCompress === "ktx2" && !hasToktx()) {
      console.error(
        [
          "[assets:build] KTX2 requiere `toktx` (KTX-Software) en el PATH.",
          "  Instalación: https://github.com/KhronosGroup/KTX-Software/releases",
          "  Workaround local: ASSETS_TEXTURE_COMPRESS=webp npm run assets:build",
        ].join("\n")
      )
      process.exit(1)
    }

    console.log(
      `[assets:build] ${sources.length} fuente(s) → niveles ${QUALITY_LEVELS.join(", ")} (texture-compress=${textureCompress})`
    )

    for (const { sceneId, sourcePath, baseName } of sources) {
      for (const level of QUALITY_LEVELS) {
        const out = outputModelPath(sceneId, baseName, level)
        await mkdir(path.dirname(out), { recursive: true })
        const relIn = path.relative(PATHS.root, sourcePath)
        const relOut = path.relative(PATHS.root, out)
        console.log(`  ${relIn} → ${relOut}`)
        optimizeLevel(sourcePath, out, level, textureCompress)
      }
    }
  }

  const byScene = await discoverOutputs()
  const { ok, rows } = evaluateBudgets(byScene)

  if (rows.length === 0) {
    console.log("[assets:build] sin salidas en public/models — presupuestos OK (vacío).")
    return
  }

  console.log("\nPresupuestos (02 §2):")
  for (const row of rows) {
    const mark = row.ok ? "ok" : "FAIL"
    console.log(
      `  [${mark}] ${row.sceneId}.${row.level}: ${row.kb} KiB / ${row.budgetKb} KiB`
    )
  }

  if (!ok) {
    console.error(
      "\n[assets:build] una o más escenas superan el presupuesto de assets."
    )
    process.exit(1)
  }

  const total = rows.reduce((s, r) => s + r.kb, 0)
  console.log(`\n[assets:build] listo · ${formatBytes(total * 1024)} totales bajo presupuesto.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
