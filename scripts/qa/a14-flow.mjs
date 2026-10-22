import { chromium, expect } from "@playwright/test"
import { writeFile } from "node:fs/promises"

const base = process.env.A14_BASE_URL ?? "http://127.0.0.1:3011"
const browser = await chromium.launch({ headless: true, channel: "msedge" })
const errors = []
const checks = []
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  for (const id of ["vibo", "pirp", "naturalis", "banner-2"]) {
    for (const tier of ["high", "medium", "low", "static"]) {
      await page.goto(`${base}/lab/${id}?progress=0.5&quality=${tier}`)
      await expect(page.locator(`[data-lab-quality="${tier}"]`)).toBeVisible()
      if (tier === "static") {
        await expect(page.locator("canvas")).toHaveCount(0)
        await expect(page.getByRole("img")).toBeVisible()
      } else {
        await expect(page.locator("canvas")).toBeVisible()
        await expect(page.locator("[data-debug-overlay]")).toContainText(
          `${id}/razonamiento`
        )
      }
      checks.push(`${id}/${tier}`)
    }
  }
  await page.goto(`${base}/lab/vibo?progress=0.4&quality=low`)
  await page.getByRole("button", { name: "Pausar golpe" }).tap()
  await expect(
    page.getByRole("button", { name: "Seguir scroll" })
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("slider", { name: "Instante del golpe" }).fill("0.8")
  await page.getByRole("button", { name: "Resaltar detección" }).tap()
  checks.push("Vibo: pausa, scrub y highlight táctiles")
  await page.goto(`${base}/lab/pirp?progress=0.3&quality=low`)
  await page
    .getByRole("button", { name: "Nuevo parque en Ciudad Aurora" })
    .tap()
  await expect(page.locator('p[role="status"]')).toContainText(
    "Servicios · Positivo"
  )
  checks.push("Pirp: clasificación táctil")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto(`${base}/?chapter=naturalis&progress=0.5&debug`)
  await expect(page.locator("canvas")).toHaveCount(0)
  await expect(page.locator("#naturalis img")).toBeVisible()
  checks.push("Movimiento reducido: recorrido con póster y sin canvas")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.goto(`${base}/?chapter=hero&quality=low&debug`)
  await expect(page.locator("canvas")).toHaveCount(1)
  const stats = () =>
    page
      .locator("[data-debug-overlay] dl")
      .evaluate((dl) =>
        Object.fromEntries(
          Array.from(dl.querySelectorAll("dt")).map((dt) => [
            dt.textContent,
            dt.nextElementSibling.textContent,
          ])
        )
      )
  await page.waitForTimeout(1200)
  const baseline = await stats()
  for (let round = 0; round < 5; round++) {
    for (const id of ["vibo", "pirp", "naturalis", "banner-2", "hero"]) {
      await page
        .locator(`[data-chapter="${id}"]`)
        .evaluate((section) =>
          window.scrollTo({
            top:
              section.getBoundingClientRect().top +
              window.scrollY +
              section.clientHeight / 2 -
              window.innerHeight / 2,
            behavior: "instant",
          })
        )
      await expect(page.locator("[data-debug-overlay] dl")).toContainText(id)
      await page.waitForTimeout(750)
      await expect(page.locator("canvas")).toHaveCount(1)
    }
  }
  await page.waitForTimeout(1200)
  const after = await stats()
  expect(after.geometries).toBe(baseline.geometries)
  expect(after.textures).toBe(baseline.textures)
  expect(after.escenas).toBe("0")
  checks.push(
    "5 vueltas por las 4 escenas: un canvas; geometrías y texturas regresan a base"
  )
  await writeFile(
    "docs/plan/evidencias/T-A14/flujo.json",
    JSON.stringify({ checks, baseline, after, errors }, null, 2)
  )
  expect(errors).toEqual([])
  console.log(checks.join("\n"))
} finally {
  await browser.close()
}
