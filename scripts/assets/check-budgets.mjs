#!/usr/bin/env node
/**
 * npm run assets:check
 *
 * Verifica que public/models/<escena>/*.{high,medium,low}.glb
 * (y texturas sueltas en public/textures/<escena>/) cumplan
 * los presupuestos de `02-rendimiento-y-mobile.md` §2.
 *
 * Sin salidas optimizadas → éxito (F0 aún no tiene modelos).
 */

import process from "node:process"

import { discoverOutputs, evaluateBudgets, formatBytes } from "./lib.mjs"

async function main() {
  const byScene = await discoverOutputs()
  const { ok, rows } = evaluateBudgets(byScene)

  if (rows.length === 0) {
    console.log(
      "[assets:check] no hay GLB optimizados en public/models — presupuestos OK (vacío)."
    )
    return
  }

  console.log("Presupuestos de assets (02 §2):")
  let failed = 0
  for (const row of rows) {
    const mark = row.ok ? "ok" : "FAIL"
    if (!row.ok) failed += 1
    console.log(
      `  [${mark}] ${row.sceneId}.${row.level}: ${row.kb} KiB / presupuesto ${row.budgetKb} KiB (${formatBytes(row.kb * 1024)})`
    )
  }

  if (!ok) {
    console.error(
      `\n[assets:check] ${failed} combinación(es) escena×nivel fuera de presupuesto.`
    )
    process.exit(1)
  }

  console.log(`\n[assets:check] ${rows.length} combinación(es) dentro de presupuesto.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
