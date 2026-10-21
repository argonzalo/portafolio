/**
 * Build con rollup-plugin-visualizer → stats.html en la raíz.
 * Uso: npm run analyze
 */
import { spawn } from "node:child_process"
import process from "node:process"

const child = spawn("npx astro build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ANALYZE: "true" },
})

child.on("exit", (code) => process.exit(code ?? 1))
