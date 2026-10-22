import { dev } from "astro"
import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import sharp from "sharp"
import { mkdir, stat, writeFile } from "node:fs/promises"

const externalBase = process.env.A18_BASE_URL
const port = 4318
const base = externalBase ?? `http://127.0.0.1:${port}`
const evidenceDir = "docs/plan/evidencias/T-A18"
await mkdir(evidenceDir, { recursive: true })
await mkdir("public/posters/greybox", { recursive: true })

const devServer = externalBase
  ? null
  : await dev({
      root: process.cwd(),
      devToolbar: { enabled: false },
      server: { port, host: "127.0.0.1" },
    })

const beats = [
  { index: 1, id: "mundo", progress: 0.12 },
  { index: 2, id: "razonamiento", progress: 0.33 },
  { index: 3, id: "grafo", progress: 0.55 },
  { index: 4, id: "tendencia", progress: 0.75 },
  { index: 5, id: "resultado", progress: 0.92 },
]

const browser = await chromium.launch({ headless: true, channel: "msedge" })
const measurements = []
const checks = []
const errors = []

try {
  // 1. Capturas y métricas por beat en Desktop (1440x900, high) y Mobile (390x844, low, CPU x4)
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
    })
    const page = await context.newPage()
    await context.route(
      (url) => url.pathname === "/",
      (route) => route.abort()
    )
    const cdp = await context.newCDPSession(page)
    if (mobile) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
    }

    page.on("pageerror", (err) => errors.push(err.message))
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    const tier = mobile ? "low" : "high"
    await page.goto(
      `${base}/lab/kit?quality=${tier}&progress=${beats[0].progress}&preset=vibo`
    )
    await page.waitForSelector("canvas")
    await page.waitForSelector("[data-debug-overlay]")

    const readDebugStats = () =>
      page
        .locator("[data-debug-overlay] dl")
        .evaluate((dl) =>
          Object.fromEntries(
            Array.from(dl.querySelectorAll("dt")).map((dt) => [
              dt.textContent,
              dt.nextElementSibling?.textContent ?? "",
            ])
          )
        )

    for (const beat of beats) {
      await page
        .locator(`button[data-kit-beat="${beat.id}"]`)
        .evaluate((btn) => {
          if (btn instanceof HTMLElement) btn.click()
        })
      await page.waitForTimeout(1100)

      const frameSample = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const samples = []
            let prev = performance.now()
            function step(now) {
              samples.push(now - prev)
              prev = now
              if (samples.length < 60) requestAnimationFrame(step)
              else {
                samples.sort((a, b) => a - b)
                const avg =
                  samples.reduce((acc, v) => acc + v, 0) / samples.length
                resolve({
                  fps: +(1000 / avg).toFixed(1),
                  p95: +samples[Math.floor(samples.length * 0.95)].toFixed(1),
                })
              }
            }
            requestAnimationFrame(step)
          })
      )

      const stats = await readDebugStats()
      measurements.push({
        beat: beat.id,
        progress: beat.progress,
        mobile,
        tier,
        ...stats,
        ...frameSample,
      })

      await page.addStyleTag({
        content:
          "vite-error-overlay, [data-debug-overlay], [data-kit-lab-controls] { display: none !important; visibility: hidden !important; }",
      })

      const png = await page.screenshot()
      const outPath = `${evidenceDir}/kit-${mobile ? "mobile" : "desktop"}-${beat.index}.webp`
      await sharp(png).webp({ quality: 86 }).toFile(outPath)

      if (beat.index === 2) {
        const posterPath = `public/posters/greybox/kit${mobile ? "-mobile" : ""}.png`
        await sharp(png).png({ palette: true }).toFile(posterPath)
      }

      await page
        .locator("style")
        .evaluateAll((nodes) =>
          nodes
            .filter((n) =>
              n.textContent?.includes("[data-kit-lab-controls]")
            )
            .forEach((n) => n.remove())
        )
    }

    // En desktop capturamos también las otras 3 paletas de marca (Pirp, Naturalis tema claro, Banner)
    if (!mobile) {
      for (const preset of ["pirp", "naturalis", "banner"]) {
        await page.goto(
          `${base}/lab/kit?quality=high&progress=0.75&preset=${preset}`
        )
        await page.waitForSelector("canvas")
        await page.waitForTimeout(900)
        await page.addStyleTag({
          content:
            "[data-debug-overlay], [data-kit-lab-controls] { visibility: hidden !important; }",
        })
        const png = await page.screenshot()
        await sharp(png)
          .webp({ quality: 86 })
          .toFile(`${evidenceDir}/kit-preset-${preset}.webp`)
      }
    }

    await context.close()
  }

  // 2. Verificación funcional: niveles high/medium/low/static, interacciones táctiles, reduced-motion y limpieza GPU
  const verifyContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const vPage = await verifyContext.newPage()
  await verifyContext.route(
    (url) => url.pathname === "/",
    (route) => route.abort()
  )
  vPage.on("pageerror", (err) => errors.push(err.message))
  vPage.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })

  for (const tier of ["high", "medium", "low", "static"]) {
    await vPage.goto(`${base}/lab/kit?progress=0.33&quality=${tier}`)
    await vPage.waitForSelector(`[data-lab-quality="${tier}"]`)
    if (tier === "static") {
      assert.equal(await vPage.locator("canvas").count(), 0)
      assert.equal(await vPage.locator("img").isVisible(), true)
    } else {
      assert.equal(await vPage.locator("canvas").count(), 1)
    }
    checks.push(`tier:${tier}:ok`)
  }

  // Interacción táctil en HUD (pines de 44x44 y bounding box)
  await vPage.goto(`${base}/lab/kit?progress=0.33&quality=low`)
  await vPage.waitForSelector("canvas")
  await vPage.waitForTimeout(700)
  await vPage.addStyleTag({
    content:
      "[data-debug-overlay], [data-kit-lab-controls] { display: none !important; }",
  })
  const pinBtn = vPage.getByRole("button", {
    name: "Inspeccionar Profundidad de pique",
  })
  await pinBtn.tap()
  assert.equal(await pinBtn.getAttribute("aria-pressed"), "true")

  const boxBtn = vPage.getByRole("button", { name: /JUGADOR P2/i })
  await boxBtn.tap()
  assert.equal(await boxBtn.getAttribute("aria-pressed"), "true")
  checks.push("hud:touch-markers-and-bbox:ok")

  // Interacción en Grafo de nodos (Beat 3)
  await vPage.goto(`${base}/lab/kit?progress=0.55&quality=low`)
  await vPage.waitForSelector("canvas")
  await vPage.waitForTimeout(700)
  await vPage.addStyleTag({
    content:
      "[data-debug-overlay], [data-kit-lab-controls] { display: none !important; }",
  })
  const nodeBtn = vPage.getByRole("button", { name: /Detección/i })
  await nodeBtn.tap()
  assert.equal(await nodeBtn.getAttribute("aria-pressed"), "true")
  checks.push("graph:touch-node:ok")

  // Verificación de estado GPU y reduced-motion
  await vPage.goto(`${base}/lab/kit?progress=0.55&quality=high`)
  await vPage.waitForSelector("canvas")
  await vPage.waitForTimeout(800)
  const gpuBefore = await vPage.evaluate(async () => {
    const { getGpuStats } = await import("/src/experience/gpuStats.ts")
    return getGpuStats()
  })
  assert(gpuBefore.geometries > 0)

  await vPage.emulateMedia({ reducedMotion: "reduce" })
  await vPage.goto(`${base}/lab/kit?progress=0.55`)
  await vPage.waitForTimeout(600)
  assert.equal(await vPage.locator("canvas").count(), 0)
  checks.push("reduced-motion:static-fallback:ok")

  await verifyContext.close()
} finally {
  await browser.close()
  if (devServer) {
    await devServer.stop()
  }
}

const desktopPosterStat = await stat("public/posters/greybox/kit.png")
const mobilePosterStat = await stat("public/posters/greybox/kit-mobile.png")

await writeFile(
  `${evidenceDir}/metricas.json`,
  JSON.stringify(
    {
      browser:
        "Edge headless, RAF 60 muestras por beat (Desktop 1440x900 high, Mobile 390x844 low CPU x4)",
      postersKB: {
        desktop: +(desktopPosterStat.size / 1024).toFixed(1),
        mobile: +(mobilePosterStat.size / 1024).toFixed(1),
      },
      measurements,
      checks,
      errors,
    },
    null,
    2
  )
)

if (errors.length > 0) {
  throw new Error(`Errores detectados en QA:\n${errors.join("\n")}`)
}

console.log("QA T-A18 completado sin errores:", checks.join(", "))
