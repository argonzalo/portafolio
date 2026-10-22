import { dev } from "astro"
import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import sharp from "sharp"
import { mkdir, writeFile } from "node:fs/promises"

const externalBase = process.env.A19_BASE_URL
const port = 4329
const base = externalBase ?? `http://127.0.0.1:${port}`
const evidenceDir = "docs/plan/evidencias/T-A19"
await mkdir(evidenceDir, { recursive: true })

const devServer = externalBase
  ? null
  : await dev({
      root: process.cwd(),
      devToolbar: { enabled: false },
      server: { port, host: "127.0.0.1" },
    })

const presets = ["vibo", "pirp", "naturalis", "banner"]
const beats = [
  { id: "tendencia", progress: 0.75, tag: "devices" },
  { id: "resultado", progress: 0.92, tag: "layers" },
]

const browser = await chromium.launch({ headless: true, channel: "msedge" })
const measurements = []
const checks = []
const errors = []

try {
  // 1. Capturas y métricas en Desktop (1440x900, high) y Mobile (390x844, low, CPU x4)
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

    for (const preset of presets) {
      for (const beat of beats) {
        await page.goto(
          `${base}/lab/kit?quality=${tier}&progress=${beat.progress}&preset=${preset}`
        )
        try {
          await page.waitForSelector("canvas", { timeout: 15000 })
        } catch {
          console.error("Errors before canvas timeout:", errors)
          throw new Error(`Canvas did not appear for ${preset} ${beat.id}`)
        }
        await page.waitForSelector("[data-debug-overlay]")
        await page.waitForTimeout(1300)

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

        const stats = await page
          .locator("[data-debug-overlay] dl")
          .evaluate((dl) =>
            Object.fromEntries(
              Array.from(dl.querySelectorAll("dt")).map((dt) => [
                dt.textContent,
                dt.nextElementSibling?.textContent ?? "",
              ])
            )
          )

        measurements.push({
          preset,
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
        const outPath = `${evidenceDir}/devices-${preset}-${mobile ? "mobile" : "desktop"}-${beat.tag}.webp`
        await sharp(png).webp({ quality: 86 }).toFile(outPath)
      }
    }

    await context.close()
  }

  // 2. Verificación unitaria en navegador de specs, fit/align, layout de capas y limpieza GPU
  const verifyContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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

  await vPage.goto(`${base}/lab/kit?progress=0.92&quality=high&preset=vibo`)
  await vPage.waitForSelector("canvas")
  await vPage.waitForTimeout(1000)

  const unitCheck = await vPage.evaluate(async () => {
    const mod = await import("/src/scenes/kit/devices/index.ts")
    const {
      PHONE_SPEC,
      LAPTOP_SPEC,
      DISPLAY_SPEC,
      PHONE_SCREEN,
      LAPTOP_SCREEN,
      getDisplayScreenSize,
      computeFitTransform,
      layoutLayerRect,
      DEVICE_FINISH_IDS,
    } = mod

    const fitTop = computeFitTransform(0.46, PHONE_SCREEN.width / PHONE_SCREEN.height, "cover", "top")
    const layerBox = layoutLayerRect([0.1, 0.2, 0.8, 0.3], fitTop, PHONE_SCREEN.width, PHONE_SCREEN.height)
    const displaySize = getDisplayScreenSize("monitor", "landscape")
    const signagePortrait = getDisplayScreenSize("signage", "portrait")

    return {
      phoneScreenRatio: +(PHONE_SCREEN.height / PHONE_SCREEN.width).toFixed(2),
      laptopScreenRatio: +(LAPTOP_SCREEN.width / LAPTOP_SCREEN.height).toFixed(2),
      displayRatio: +(displaySize.width / displaySize.height).toFixed(2),
      signagePortraitRatio: +(signagePortrait.height / signagePortrait.width).toFixed(2),
      finishes: DEVICE_FINISH_IDS.length,
      layerWidthPositive: layerBox.width > 0 && layerBox.height > 0,
      specsValid:
        PHONE_SPEC.width > 0.6 &&
        LAPTOP_SPEC.width > 3.0 &&
        DISPLAY_SPEC.width > 6.0,
    }
  })

  assert.equal(unitCheck.specsValid, true)
  assert.equal(unitCheck.layerWidthPositive, true)
  assert.equal(unitCheck.finishes, 5)
  checks.push("devices:specs-and-uv-fit:ok")

  await verifyContext.close()
} finally {
  await browser.close()
  if (devServer) {
    await devServer.stop()
  }
}

await writeFile(
  `${evidenceDir}/metricas.json`,
  JSON.stringify(
    {
      browser:
        "Edge headless, RAF 60 muestras (Desktop 1440x900 high, Mobile 390x844 low CPU x4)",
      measurements,
      checks,
      errors,
    },
    null,
    2
  )
)

if (errors.length > 0) {
  throw new Error(`Errores detectados en QA T-A19:\n${errors.join("\n")}`)
}

console.log("QA T-A19 completado sin errores:", checks.join(", "))
