import { chromium } from "@playwright/test"
import sharp from "sharp"
import { mkdir, writeFile } from "node:fs/promises"

const base = process.env.A14_BASE_URL ?? "http://127.0.0.1:3011"
const evidence = "docs/plan/evidencias/T-A14"
await mkdir(evidence, { recursive: true })
await mkdir("public/posters/greybox", { recursive: true })
const browser = await chromium.launch({ headless: true, channel: "msedge" })
const measurements = []
const errors = []
const scenes = {
  vibo: [0.1, 0.4, 0.7, 0.9],
  pirp: [0.1, 0.3, 0.5, 0.7, 0.9],
  naturalis: [0.1, 0.3, 0.5, 0.7, 0.9],
  "banner-2": [0.1, 0.3, 0.5, 0.7, 0.9],
}
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      isMobile: mobile,
      hasTouch: mobile,
    })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    if (mobile) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 })
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    for (const [id, beats] of Object.entries(scenes)) {
      const tier = mobile ? "low" : "high"
      await page.goto(`${base}/lab/${id}?quality=${tier}&progress=${beats[0]}`)
      await page.waitForSelector("canvas")
      await page.waitForSelector("[data-debug-overlay]")
      for (const [index, progress] of beats.entries()) {
        await page
          .getByRole("slider", { name: "Progreso del capítulo" })
          .fill(String(progress))
        await page.waitForTimeout(1500)
        const readStats = () =>
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
        const frames = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const samples = []
              let previous = performance.now()
              function sample(now) {
                samples.push(now - previous)
                previous = now
                if (samples.length < 60) requestAnimationFrame(sample)
                else {
                  samples.sort((a, b) => a - b)
                  resolve({
                    fps: +(
                      1000 /
                      (samples.reduce((a, b) => a + b, 0) / samples.length)
                    ).toFixed(1),
                    p95: +samples[Math.floor(samples.length * 0.95)].toFixed(1),
                  })
                }
              }
              requestAnimationFrame(sample)
            })
        )
        const stats = await readStats()
        measurements.push({
          scene: id,
          mobile,
          tier,
          progress,
          ...stats,
          ...frames,
        })
        await page.addStyleTag({
          content:
            "[data-debug-overlay], [data-lab-scene] > .fixed { visibility:hidden !important }",
        })
        const png = await page.screenshot()
        await sharp(png)
          .webp({ quality: 82 })
          .toFile(
            `${evidence}/${id}-${mobile ? "mobile" : "desktop"}-${index + 1}.webp`
          )
        if (index === (id === "vibo" ? 1 : 2))
          await sharp(png)
            .png({ palette: true })
            .toFile(
              `public/posters/greybox/${id}${mobile ? "-mobile" : ""}.png`
            )
        await page
          .locator("style")
          .evaluateAll((nodes) =>
            nodes
              .filter((n) =>
                n.textContent.includes("[data-lab-scene] > .fixed")
              )
              .forEach((n) => n.remove())
          )
      }
      console.log(
        `${id} ${mobile ? "mobile CPU x4" : "desktop"}: capturas y métricas listas`
      )
    }
    await context.close()
  }
} finally {
  await browser.close()
}
await writeFile(
  `${evidence}/metricas.json`,
  JSON.stringify(
    {
      browser: "Edge headless, GPU de esta máquina; RAF 60 muestras por beat",
      measurements,
      errors,
    },
    null,
    2
  )
)
if (errors.length) throw new Error(errors.join("\n"))
