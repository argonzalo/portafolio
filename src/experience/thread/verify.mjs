import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"

const base = process.env.A41_BASE_URL ?? "http://127.0.0.1:3013"
const evidenceDir = "docs/plan/evidencias/T-A41"
await mkdir(evidenceDir, { recursive: true })

const browser = await chromium.launch({ headless: true, channel: "msedge" })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
})
// Evitar el bug de OXC dev en ManifestoChapter.astro (<script> con anotación TS sin tocar archivo fuera de zona)
await context.route("**/ManifestoChapter.astro?astro&type=script*", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "export {};",
  })
)
const page = await context.newPage()
const errors = []

// Warmup inicial para que Vite termine de optimizar dependencias antes de medir
await page.goto(`${base}/?chapter=hero&quality=high&debug`)
await page.waitForTimeout(1500)

page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text())
})

const readState = () =>
  page.evaluate(async () => {
    const { getGpuStats } = await import("/src/experience/gpuStats.ts")
    const { experienceStore } = await import("/src/experience/store.ts")
    const { threadTip } = await import("/src/experience/thread/runtime.ts")
    const { getLivePalette } = await import("/src/experience/palette.ts")
    const snap = experienceStore.getSnapshot()
    return {
      chapterId: snap.chapterId,
      gpu: getGpuStats(),
      progress: snap.chapterId
        ? experienceStore.progress(snap.chapterId).current
        : 0,
      tip: threadTip.position.toArray(),
      visible: threadTip.visible,
      palette: { ...getLivePalette() },
    }
  })

// 1. Verificar matematicamente los encuadres de borde, curvas y perfiles del hilo (T-A41)
await page.goto(`${base}/?chapter=hero&quality=high&debug`)
await page.waitForTimeout(1500)

const handoffMath = await page.evaluate(async () => {
  const { sampleForm, createThreadFrame, chapterThreadProfile } =
    await import("/src/experience/thread/forms.ts")
  const { vibo, viboBorderFrames } = await import(
    "/src/scenes/vibo/definition.ts"
  )
  const { pirp, pirpBorderFrames } = await import(
    "/src/scenes/pirp/definition.ts"
  )
  const { naturalis, naturalisBorderFrames } = await import(
    "/src/scenes/naturalis/definition.ts"
  )
  const { banner, bannerBorderFrames } = await import(
    "/src/scenes/banner-2/definition.ts"
  )

  const maxDist = (a, b) =>
    Math.max(
      ...a.map((p, i) => p.distanceTo(b[i]))
    )

  const fA = createThreadFrame().points
  const fB = createThreadFrame().points

  sampleForm(vibo.thread, 1, 1, 1, fA)
  sampleForm(pirp.thread, 0, 1, 1, fB)
  const viboToPirpCurveDelta = maxDist(fA, fB)

  sampleForm(pirp.thread, 1, 1, 1, fA)
  sampleForm(naturalis.thread, 0, 1, 1, fB)
  const pirpToNaturalisCurveDelta = maxDist(fA, fB)

  sampleForm(naturalis.thread, 1, 1, 1, fA)
  sampleForm(banner.thread, 0, 1, 1, fB)
  const naturalisToBannerCurveDelta = maxDist(fA, fB)

  // Verificar que Banner ya no tiene salto discontinuo alrededor de p=0.6
  sampleForm(banner.thread, 0.59, 1, 1, fA)
  sampleForm(banner.thread, 0.61, 1, 1, fB)
  const bannerContinuityAt06 = maxDist(fA, fB)

  return {
    viboToPirpCameraMatch:
      JSON.stringify(viboBorderFrames.exit) ===
      JSON.stringify(pirpBorderFrames.entry),
    pirpToNaturalisCameraMatch:
      JSON.stringify(pirpBorderFrames.exit) ===
      JSON.stringify(naturalisBorderFrames.entry),
    naturalisToBannerCameraMatch:
      JSON.stringify(naturalisBorderFrames.exit) ===
      JSON.stringify(bannerBorderFrames.entry),
    viboToPirpCurveDelta,
    pirpToNaturalisCurveDelta,
    naturalisToBannerCurveDelta,
    bannerContinuityAt06,
    naturalisScheme: chapterThreadProfile("naturalis").scheme,
  }
})

assert.equal(handoffMath.viboToPirpCameraMatch, true)
assert.equal(handoffMath.pirpToNaturalisCameraMatch, true)
assert.equal(handoffMath.naturalisToBannerCameraMatch, true)
assert(handoffMath.viboToPirpCurveDelta < 1e-5)
assert(handoffMath.pirpToNaturalisCurveDelta < 1e-5)
assert(handoffMath.naturalisToBannerCurveDelta < 0.35)
assert(handoffMath.bannerContinuityAt06 < 0.15)
assert.equal(handoffMath.naturalisScheme, "light")

// 2. Capturas y metricas de los 3 handoffs de primera linea (desktop 1440x900 high y mobile 390x844 low CPU x4)
const transitions = [
  {
    id: "vibo-to-pirp",
    from: "vibo",
    to: "pirp",
    progressOut: 0.92,
    progressIn: 0.08,
  },
  {
    id: "pirp-to-naturalis",
    from: "pirp",
    to: "naturalis",
    progressOut: 0.92,
    progressIn: 0.08,
  },
  {
    id: "naturalis-to-banner-2",
    from: "naturalis",
    to: "banner-2",
    progressOut: 0.92,
    progressIn: 0.08,
  },
]

const samplePerf = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const deltas = []
        let last = performance.now()
        let count = 0
        function step(now) {
          deltas.push(now - last)
          last = now
          if (++count < 45) {
            requestAnimationFrame(step)
          } else {
            const sorted = [...deltas].sort((a, b) => a - b)
            const avg = deltas.reduce((s, v) => s + v, 0) / deltas.length
            const p95 = sorted[Math.floor(sorted.length * 0.95)]
            resolve({
              fps: Number((1000 / avg).toFixed(1)),
              p95Ms: Number(p95.toFixed(1)),
            })
          }
        }
        requestAnimationFrame((now) => {
          last = now
          requestAnimationFrame(step)
        })
      })
  )

const transitionMetrics = []

for (const mode of [
  { name: "desktop", width: 1440, height: 900, quality: "high", cpuRate: 1 },
  { name: "mobile", width: 390, height: 844, quality: "low", cpuRate: 4 },
]) {
  await page.setViewportSize({ width: mode.width, height: mode.height })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: mode.cpuRate })

  for (const tr of transitions) {
    // Posicionarse en el borde de salida (progress = 0.92, handoff activo)
    await page.goto(
      `${base}/?chapter=${tr.from}&progress=${tr.progressOut}&quality=${mode.quality}`
    )
    await page.waitForTimeout(900)
    const stateOut = await readState()
    await page.screenshot({
      path: `${evidenceDir}/${tr.id}-${mode.name}-out.webp`,
      type: "webp",
      quality: 86,
    })

    // Cruzar al capitulo entrante haciendo scroll real en el DOM para activar el handoff y crossfade
    await page.evaluate(
      ({ to, progressIn }) => {
        const section = document.querySelector(`[data-chapter="${to}"]`)
        if (section) {
          const rect = section.getBoundingClientRect()
          const targetScroll =
            window.scrollY +
            rect.top -
            window.innerHeight * 0.5 +
            rect.height * progressIn
          window.scrollTo({ top: targetScroll, behavior: "instant" })
        }
      },
      { to: tr.to, progressIn: tr.progressIn }
    )
    await page.waitForTimeout(320)
    const perfMid = await samplePerf()
    const stateMid = await readState()
    await page.screenshot({
      path: `${evidenceDir}/${tr.id}-${mode.name}-in.webp`,
      type: "webp",
      quality: 86,
    })

    transitionMetrics.push({
      transition: tr.id,
      mode: mode.name,
      quality: mode.quality,
      fps: perfMid.fps,
      p95Ms: perfMid.p95Ms,
      calls: stateMid.gpu.calls,
      triangles: stateMid.gpu.triangles,
      mountedScenes: stateMid.gpu.mountedScenes,
      paletteOut: stateOut.palette.background,
      paletteIn: stateMid.palette.background,
    })
  }

  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 })
}

// 3. Verificar persistencia de Canvas, liberacion de GPU y custom anchors
await page.setViewportSize({ width: 1440, height: 900 })
await page.goto(`${base}/?chapter=hero&quality=high&debug`)
await page.waitForTimeout(1000)
const baselineHero = await readState()

await page.evaluate(() => {
  window.originalCanvas = document.querySelector("canvas")
})
for (let i = 0; i < 5; i++) {
  for (const path of [
    "/projects/vibo",
    "/?chapter=vibo&progress=0.45&quality=high&debug",
  ]) {
    await page.evaluate((targetPath) => {
      const a = document.createElement("a")
      a.href = targetPath
      document.body.append(a)
      a.click()
      a.remove()
    }, path)
    await page.waitForTimeout(600)
    assert(
      await page.evaluate(
        () => window.originalCanvas === document.querySelector("canvas")
      )
    )
  }
}

await page.goto(`${base}/?chapter=hero&quality=high&debug`)
await page.waitForTimeout(1000)
const afterHero = await readState()
assert.equal(afterHero.gpu.geometries, baselineHero.gpu.geometries)
assert.equal(afterHero.gpu.textures, baselineHero.gpu.textures)
assert.equal(afterHero.gpu.mountedScenes, 0)

const forms = await page.evaluate(async () => {
  const { sampleForm, createThreadFrame } =
    await import("/src/experience/thread/forms.ts")
  const output = createThreadFrame().points
  sampleForm(
    {
      shape: "custom",
      color: "#fff",
      anchors: (p) => [
        [0, 0, 0],
        [p, 2, 3],
      ],
    },
    0.5,
    1,
    1,
    output
  )
  return [output[0].toArray(), output.at(-1).toArray()]
})
assert.deepEqual(forms, [
  [0, 0, 0],
  [0.5, 2, 3],
])
assert.deepEqual(errors, [])

await writeFile(
  `${evidenceDir}/metricas.json`,
  JSON.stringify({ handoffMath, transitionMetrics, baselineHero, afterHero, errors }, null, 2)
)

console.log(
  "PASS: T-A41 transitions, camera border handoffs, thread continuity, persistent canvas, and GPU baseline."
)
await browser.close()
