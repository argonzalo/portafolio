import { defineConfig } from "@playwright/test"
import config from "../../../../playwright.config"

// El navegador empaquetado de Playwright no está instalado en este equipo.
// Se ejecuta la misma suite sobre Chrome disponible, sin cambiar la config CI.
export default defineConfig({
  ...config,
  testDir: "../../../../tests",
  projects: [{ name: "chrome-local", use: { channel: "chrome" } }],
})
