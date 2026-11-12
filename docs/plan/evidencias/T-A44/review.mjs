import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { chromium } from "@playwright/test"
import ts from "typescript"
import sharp from "sharp"
import { fileURLToPath } from "node:url"

const base = new URL("./", import.meta.url)
const baseline = JSON.parse(
  await readFile(new URL("baseline.json", base), "utf8")
)
const original = execFileSync(
  "git",
  ["show", "b5fb2ff630dd74657bf6e5c681e6baca547ea85e:src/scenes/vibo/world.ts"],
  { encoding: "utf8" }
)
const { outputText } = ts.transpileModule(
  original.slice(original.indexOf("export const CAMERA_KEYS")),
  { compilerOptions: { module: ts.ModuleKind.ESNext } }
)
const { CAMERA_KEYS: oldFrames } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
)
const browser = await chromium.launch({ channel: "chrome", headless: true })
const results = []

async function seek(page, id, progress) {
  await page.evaluate(
    ({ id, progress }) => {
      const section = document.querySelector(`[data-chapter="${id}"]`)
      window.scrollTo({
        top:
          section.getBoundingClientRect().top +
          scrollY -
          innerHeight / 2 +
          section.offsetHeight * progress,
        behavior: "instant",
      })
      window.dispatchEvent(new Event("experience:seek"))
    },
    { id, progress }
  )
  await page.waitForTimeout(350)
}

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: name === "mobile",
    hasTouch: name === "mobile",
  })
  const page = await context.newPage()
  const errors = []
  await page.goto("http://127.0.0.1:3011/?quality=medium", {
    waitUntil: "networkidle",
  })
  // Preparar las dependencias lazy de Vite y recargar después del optimizador.
  await page.evaluate(async () => {
    for (const id of ["vibo", "pirp", "naturalis", "banner-2", "agnt"]) {
      try {
        await import(`/src/scenes/${id}/Scene.tsx`)
      } catch {
        /* la recarga usa el hash nuevo */
      }
    }
  })
  await page.waitForTimeout(1500)
  await page.reload({ waitUntil: "networkidle" })
  page.on("pageerror", (e) => {
    errors.push(e.message)
    console.error(e.message)
  })
  page.on("console", (m) => {
    if (m.type() === "error") {
      errors.push(m.text())
      console.error(m.text())
    }
  })
  await page.waitForSelector("[data-experience-stage] canvas")
  await page.waitForTimeout(700)
  const chapters = await page
    .locator("[data-chapter]")
    .evaluateAll((nodes) =>
      nodes.map((el) => ({ id: el.dataset.chapter, height: el.offsetHeight }))
    )
  const ratios = chapters
    .filter((c) =>
      ["manifesto", "vibo", "pirp", "naturalis", "banner-2", "agnt"].includes(
        c.id
      )
    )
    .map((c) => ({
      id: c.id,
      ratio:
        c.height /
        baseline
          .find((b) => b.name === name)
          .chapters.find((b) => b.id === c.id).height,
    }))
  for (const c of ratios)
    assert.ok(
      Math.abs(
        c.ratio - (c.id === "vibo" ? 2 : c.id === "banner-2" ? 5.4 : 1.8)
      ) < 0.003,
      JSON.stringify(c)
    )
  const shots = []
  const samples = []
  for (const [id, points] of [
    ["manifesto", [0.25, 0.55, 0.72]],
    ["vibo", [0.1, 0.39, 0.69, 0.84]],
    ["pirp", [0.1, 0.3, 0.5, 0.7, 0.84]],
    ["naturalis", [0.1, 0.3, 0.5, 0.7, 0.84]],
    ["banner-2", [0.1, 0.36, 0.6, 0.84]],
    ["agnt", [0.17, 0.51, 0.82]],
  ]) {
    for (const p of points) {
      await seek(page, id, p)
      const filename = `${name}-${id}-${p}.png`
      await page.screenshot({
        path: new URL(filename, base).pathname.replace(/^\/(\w:)/, "$1"),
      })
      shots.push(filename)
      const sample = await page.evaluate(async () => {
        const { experienceStore: s } = await import("/src/experience/store.ts")
        const { getGpuStats } = await import("/src/experience/gpuStats.ts")
        return { ...s.getSnapshot(), gpu: getGpuStats() }
      })
      assert.equal(sample.chapterId, id)
      assert.ok(sample.gpu.mountedScenes <= 2)
      samples.push({
        id,
        progress: p,
        gpu: sample.gpu,
        quality: sample.quality,
      })
    }
  }

  const copy = []
  for (const id of ["pirp", "naturalis"]) {
    for (const p of [0.199, 0.2, 0.201, 0.3, 0.199]) {
      await seek(page, id, p)
      const state = await page
        .locator(`.${id === "pirp" ? "pirp-heading" : "naturalis-copy"} h2`)
        .evaluate((el) => ({
          text: el.textContent,
          opacity: Number(getComputedStyle(el).opacity),
        }))
      if (p > 0.198 && p < 0.202)
        assert.ok(state.opacity < 0.02, JSON.stringify(state))
      else assert.ok(state.opacity > 0.99)
      copy.push({ id, p, ...state })
    }
  }

  const manifesto = []
  for (const p of [0.55, 0.65, 0.74, 0.55]) {
    await seek(page, "manifesto", p)
    manifesto.push(
      await page
        .locator(".manifesto-copy")
        .evaluate((el) => ({
          opacity: Number(getComputedStyle(el).opacity),
          phrases: [...el.querySelectorAll("li")].map((li) =>
            Number(getComputedStyle(li).opacity)
          ),
        }))
    )
  }
  assert.ok(manifesto[0].phrases.every((p) => p > 0.99))
  assert.ok(manifesto[0].opacity > 0.99 && manifesto[2].opacity < 0.01)
  assert.deepEqual(manifesto[0], manifesto[3])

  const transitions = []
  for (const id of [
    "manifesto",
    "vibo",
    "pirp",
    "naturalis",
    "banner-2",
    "agnt",
  ]) {
    await seek(page, id, 0.93)
    const before = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--journey-background")
    )
    const trace = await page.evaluate(async (id) => {
      const { experienceStore: s } = await import("/src/experience/store.ts")
      const { getGpuStats } = await import("/src/experience/gpuStats.ts")
      const section = document.getElementById(id)
      const origin =
        section.getBoundingClientRect().top + scrollY - innerHeight / 2
      const start = performance.now()
      const samples = []
      await new Promise((resolve) => {
        function tick(now) {
          const t = Math.min(1, (now - start) / 1200)
          const p = 0.93 + (t < 0.5 ? t * 2 : (1 - t) * 2) * 0.1
          window.scrollTo({
            top: origin + section.offsetHeight * p,
            behavior: "instant",
          })
          samples.push({
            chapter: s.getSnapshot().chapterId,
            scenes: getGpuStats().mountedScenes,
          })
          if (t < 1) requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
      return samples
    }, id)
    await seek(page, id, 0.93)
    const after = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--journey-background")
    )
    assert.equal(before, after, `paleta reversible en ${id}`)
    assert.ok(trace.every((s) => s.scenes <= 2))
    transitions.push({
      id,
      reversible: true,
      chapters: [...new Set(trace.map((s) => s.chapter))],
      maxScenes: Math.max(...trace.map((s) => s.scenes)),
    })
  }

  const camera = await page.evaluate(
    async ({ oldFrames, isMobile, oldHeight, newHeight }) => {
      const { CAMERA_KEYS } = await import("/src/scenes/vibo/world.ts")
      const { interpolateCameraState } =
        await import("/src/scenes/kit/cameraRig.ts")
      const peak = (frames, height, from, to) => {
        let distance = 0,
          angle = 0
        const direction = (s) => {
          const v = s.target.map((x, i) => x - s.position[i])
          const n = Math.hypot(...v)
          return v.map((x) => x / n)
        }
        for (let p = from; p < to; p += 0.0005) {
          const a = interpolateCameraState(frames, p, isMobile)
          const b = interpolateCameraState(frames, p + 0.0005, isMobile)
          distance = Math.max(
            distance,
            (Math.hypot(...a.position.map((v, i) => v - b.position[i])) /
              (height * 0.0005)) *
              100
          )
          const u = direction(a),
            v = direction(b)
          angle = Math.max(
            angle,
            ((Math.acos(
              Math.min(
                1,
                Math.max(
                  -1,
                  u.reduce((s, x, i) => s + x * v[i], 0)
                )
              )
            ) *
              180) /
              Math.PI /
              (height * 0.0005)) *
              100
          )
        }
        return { worldUnitsPer100px: distance, degreesPer100px: angle }
      }
      return [
        [0, 0.28],
        [0.5, 0.86],
      ].map(([from, to]) => ({
        from,
        to,
        before: peak(oldFrames, oldHeight, from, to),
        after: peak(CAMERA_KEYS, newHeight, from, to),
      }))
    },
    {
      oldFrames,
      isMobile: name === "mobile",
      oldHeight: baseline
        .find((b) => b.name === name)
        .chapters.find((c) => c.id === "vibo").height,
      newHeight: chapters.find((c) => c.id === "vibo").height,
    }
  )
  for (const c of camera) {
    assert.ok(
      c.after.worldUnitsPer100px < c.before.worldUnitsPer100px * 0.65,
      JSON.stringify(c)
    )
    assert.ok(
      c.after.degreesPer100px < c.before.degreesPer100px * 0.65,
      JSON.stringify(c)
    )
    assert.ok(c.after.degreesPer100px < 25, JSON.stringify(c))
  }

  const tiers = []
  for (const tier of ["high", "medium", "low"]) {
    await page.evaluate(
      async (tier) =>
        (await import("/src/experience/quality.ts")).forceQuality(tier),
      tier
    )
    for (const id of ["vibo", "pirp", "naturalis", "banner-2", "agnt"]) {
      await seek(page, id, 0.45)
      tiers.push(
        await page.evaluate(async () => {
          const { experienceStore: s } =
            await import("/src/experience/store.ts")
          const { getGpuStats } = await import("/src/experience/gpuStats.ts")
          return {
            id: s.getSnapshot().chapterId,
            quality: s.getSnapshot().quality,
            ...getGpuStats(),
          }
        })
      )
    }
  }

  // Medición informativa del entorno local, con CPU x4 en mobile emulado.
  if (name === "mobile")
    await (
      await context.newCDPSession(page)
    ).send("Emulation.setCPUThrottlingRate", { rate: 4 })
  await seek(page, "vibo", 0.39)
  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const start = performance.now()
        let frames = 0
        function tick(now) {
          frames++
          if (now - start < 1200) requestAnimationFrame(tick)
          else resolve((frames * 1000) / (now - start))
        }
        requestAnimationFrame(tick)
      })
  )
  // También al cambiar la preferencia mientras el manifiesto está apagado.
  if (name === "mobile")
    await (
      await context.newCDPSession(page)
    ).send("Emulation.setCPUThrottlingRate", { rate: 1 })
  await seek(page, "manifesto", 0.78)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.waitForTimeout(300)
  const reducedAfterExit = await page
    .locator(".manifesto-copy")
    .evaluate((el) => Number(getComputedStyle(el).opacity))
  assert.equal(reducedAfterExit, 1)
  assert.deepEqual(errors, [])
  results.push({
    name,
    ratios,
    camera,
    samples,
    copy,
    manifesto,
    transitions,
    tiers,
    fps,
    cpuThrottle: name === "mobile" ? 4 : 1,
    reducedAfterExit,
    errors,
  })
  await context.close()

  const thumbW = 300,
    thumbH = Math.round((height * thumbW) / width)
  const thumbnails = await Promise.all(
    shots.map(async (filename, i) => ({
      input: await sharp(fileURLToPath(new URL(filename, base)))
        .resize(thumbW, thumbH)
        .png()
        .toBuffer(),
      left: (i % 4) * thumbW,
      top: Math.floor(i / 4) * thumbH,
    }))
  )
  await sharp({
    create: {
      width: thumbW * 4,
      height: thumbH * Math.ceil(shots.length / 4),
      channels: 3,
      background: "#131317",
    },
  })
    .composite(thumbnails)
    .png()
    .toFile(
      new URL(`${name}-overview.png`, base).pathname.replace(/^\/(\w:)/, "$1")
    )
}

const reduced = await browser.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
})
await reduced.goto("http://127.0.0.1:3011/", { waitUntil: "networkidle" })
await reduced.locator("#manifesto").scrollIntoViewIfNeeded()
const accessible = await reduced
  .locator("[data-manifesto-phrase]")
  .evaluateAll((nodes) =>
    nodes.every((el) => Number(getComputedStyle(el).opacity) === 1)
  )
assert.ok(accessible)
assert.equal(await reduced.locator("[data-experience-stage] canvas").count(), 0)
await reduced.screenshot({
  path: new URL("mobile-reduced-motion.png", base).pathname.replace(
    /^\/(\w:)/,
    "$1"
  ),
})
results.push({
  reducedMotion: true,
  manifestoReadable: accessible,
  canvas: false,
})
await reduced.close()
await browser.close()
await writeFile(new URL("review.json", base), JSON.stringify(results, null, 2))
console.log(
  JSON.stringify(
    results.map((r) => ({
      name: r.name,
      ratios: r.ratios,
      camera: r.camera,
      fps: r.fps,
      errors: r.errors,
      reducedMotion: r.reducedMotion,
    })),
    null,
    2
  )
)
