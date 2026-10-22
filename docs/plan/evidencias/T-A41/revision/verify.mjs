import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import sharp from "sharp"

const base = process.env.A41_BASE_URL ?? "http://localhost:4321"
const output = "docs/plan/evidencias/T-A41/revision"
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: "msedge", headless: true })
const report = { views: [], errors: [], warnings: [] }
const chapters = ["vibo", "pirp", "naturalis", "banner-2"]
for (const view of [
  { name: "desktop", width: 1440, height: 900, quality: "high", cpu: 1 },
  { name: "mobile", width: 390, height: 844, quality: "low", cpu: 4 },
]) {
  if (process.env.A41_VIEW && process.env.A41_VIEW !== view.name) continue
  const page = await browser.newPage({
    viewport: { width: view.width, height: view.height },
  })
  page.on("pageerror", (e) => report.errors.push(`${view.name}: ${e.message}`))
  page.on("console", (m) => {
    if (m.type() === "error") report.errors.push(m.text())
    if (m.type() === "warning") report.warnings.push(m.text())
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: view.cpu })
  await page.goto(`${base}/?chapter=vibo&progress=0.1&quality=${view.quality}`)
  await page.waitForFunction(async () => {
    const f = await import("/node_modules/.vite/deps/@react-three_fiber.js")
    return (
      f._roots.size === 1 &&
      [...f._roots.values()][0].store.getState().scene.background !== null
    )
  })
  await page.waitForTimeout(2200)
  await page.addStyleTag({
    content: "astro-dev-toolbar { display:none !important }",
  })
  await page.evaluate(async () => {
    const { experienceStore } = await import("/src/experience/store.ts")
    const { getGpuStats } = await import("/src/experience/gpuStats.ts")
    const { threadTip } = await import("/src/experience/thread/runtime.ts")
    const { _roots } =
      await import("/node_modules/.vite/deps/@react-three_fiber.js")
    window.a41 = {
      store: experienceStore,
      stats: getGpuStats,
      tip: threadTip,
      roots: _roots,
    }
  })
  const seek = async (id, p) => {
    await page.evaluate(
      ({ id, p }) => {
        const section = document.querySelector(`[data-chapter="${id}"]`)
        window.scrollTo({
          top:
            section.getBoundingClientRect().top +
            scrollY -
            innerHeight / 2 +
            p * section.offsetHeight,
          behavior: "instant",
        })
      },
      { id, p }
    )
    await page
      .waitForFunction(
        ({ id, p }) =>
          window.a41.store.getSnapshot().chapterId === id &&
          Math.abs(window.a41.store.progress(id).current - p) < 0.0004,
        { id, p },
        { timeout: 10000 }
      )
      .catch(async (error) => {
        console.log(
          "seek failed",
          id,
          p,
          await page.evaluate(() => ({
            scrollY,
            innerHeight,
            chapter: window.a41.store.getSnapshot(),
            vibo: window.a41.store.progress("vibo").current,
            rect: document
              .querySelector("#vibo")
              .getBoundingClientRect()
              .toJSON(),
          }))
        )
        throw error
      })
    await page.waitForTimeout(120)
  }
  const sample = () =>
    page.evaluate(() => {
      const a = window.a41,
        root = [...a.roots.values()][0].store.getState(),
        snap = a.store.getSnapshot()
      let tip = null
      root.scene.traverse((object) => {
        const u = object.material?.uniforms
        if (!tip && u?.uPath && u?.uPhase && u?.uUsePath?.value === 1) {
          const path = u.uPath.value,
            index = u.uPhase.value * (path.length - 1)
          tip = path[Math.floor(index)]
            .clone()
            .lerp(path[Math.ceil(index)], index % 1)
            .applyMatrix4(object.matrixWorld)
            .toArray()
        }
      })
      return {
        chapter: snap.chapterId,
        p: a.store.progress(snap.chapterId).current,
        camera: root.camera.position.toArray(),
        quaternion: root.camera.quaternion.toArray(),
        tip,
        gpu: {
          ...a.stats(),
          calls: root.gl.info.render.calls,
          triangles: root.gl.info.render.triangles,
          geometries: root.gl.info.memory.geometries,
          textures: root.gl.info.memory.textures,
        },
        background: root.scene.background.getHexString(),
        caption: [...document.querySelectorAll("[data-scene-caption]")]
          .filter((e) => +getComputedStyle(e).opacity > 0.9)
          .map((e) => ({
            id: e.dataset.sceneCaption,
            y: e.getBoundingClientRect().top,
            background: getComputedStyle(e).backgroundImage,
          })),
      }
    })
  const viewReport = { ...view, beats: [], joins: [], motion: [], memory: [] }
  const images = []
  for (const id of process.env.A41_ONLY === "memory" ? [] : chapters) {
    for (const p of [0.1, 0.3, 0.5, 0.7, 0.84]) {
      await seek(id, p)
      const sampleState = await sample()
      viewReport.beats.push({ id, p, ...sampleState })
      assert.equal(sampleState.chapter, id)
      assert.ok(sampleState.gpu.mountedScenes <= 2)
      assert.equal(sampleState.caption[0]?.background, "none")
      assert.equal(sampleState.caption[0]?.y, 0)
      const file = `${output}/${view.name}-${id}-${p}.webp`
      await sharp(await page.screenshot())
        .webp({ quality: 80 })
        .toFile(file)
      images.push(file)
    }
  }
  const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]))
  for (
    let i = 0;
    i < (process.env.A41_ONLY === "memory" ? 0 : chapters.length - 1);
    i++
  ) {
    const id = chapters[i],
      next = chapters[i + 1]
    // Sampling on the same page preserves scene identity and catches remount jumps.
    await seek(id, 0.9998)
    const before = await sample()
    await seek(next, 0.0002)
    const after = await sample()
    await seek(id, 0.9998)
    const reverse = await sample()
    assert.ok(
      before.tip && after.tip && reverse.tip,
      "shader path must be bound"
    )
    const join = {
      id,
      next,
      positionDelta: distance(before.camera, after.camera),
      rotationDelta: distance(before.quaternion, after.quaternion),
      tipDelta: distance(before.tip, after.tip),
      reversePositionError: distance(before.camera, reverse.camera),
      reverseTipError: distance(before.tip, reverse.tip),
    }
    if (join.positionDelta >= 0.01)
      console.log({ before, after, reverse, errors: report.errors })
    assert.ok(join.positionDelta < 0.01, JSON.stringify(join))
    assert.ok(join.rotationDelta < 0.001, JSON.stringify(join))
    assert.ok(join.tipDelta < 0.03, JSON.stringify(join))
    assert.ok(join.reversePositionError < 0.001, JSON.stringify(join))
    assert.ok(join.reverseTipError < 0.001, JSON.stringify(join))
    viewReport.joins.push(join)
    for (const p of [0.87, 0.91, 0.95, 0.99]) {
      await seek(id, p)
      await sharp(await page.screenshot())
        .webp({ quality: 80 })
        .toFile(`${output}/${view.name}-${id}-handoff-${p}.webp`)
    }
    await seek(id, 0.84)
    // Real forward/reverse scroll, sampled every rendered frame, including exact boundary.
    const motion = await page.evaluate(
      async ({ id, next }) => {
        const a = window.a41,
          root = [...a.roots.values()][0].store.getState()
        const section = document.querySelector(`[data-chapter="${id}"]`)
        const start =
          section.getBoundingClientRect().top +
          scrollY -
          innerHeight / 2 +
          0.84 * section.offsetHeight
        const finish = start + 0.23 * section.offsetHeight
        const rows = []
        let first = 0,
          last = 0
        await new Promise((resolve) => {
          const run = (time) => {
            if (!first) first = time
            const t = Math.min(1, (time - first) / 3000)
            window.scrollTo({
              top: start + (finish - start) * (t < 0.5 ? t * 2 : 2 - t * 2),
              behavior: "instant",
            })
            const snap = a.store.getSnapshot()
            rows.push({
              dt: last ? time - last : 0,
              chapter: snap.chapterId,
              camera: root.camera.position.toArray(),
              q: root.camera.quaternion.toArray(),
              calls: root.gl.info.render.calls,
              triangles: root.gl.info.render.triangles,
            })
            last = time
            if (t < 1) requestAnimationFrame(run)
            else resolve()
          }
          requestAnimationFrame(run)
        })
        return { id, next, rows }
      },
      { id, next }
    )
    const times = motion.rows
      .slice(1)
      .map((r) => r.dt)
      .sort((a, b) => a - b)
    viewReport.motion.push({
      id,
      next,
      frames: times.length,
      fps: 1000 / (times.reduce((a, b) => a + b, 0) / times.length),
      p95: times[Math.floor(times.length * 0.95)],
      maxCalls: Math.max(...motion.rows.map((r) => r.calls)),
      maxTriangles: Math.max(...motion.rows.map((r) => r.triangles)),
      maxCameraStep: Math.max(
        ...motion.rows
          .slice(1)
          .map((r, i) => distance(r.camera, motion.rows[i].camera))
      ),
      crossed: motion.rows.some((r) => r.chapter === next),
    })
  }
  // A contact sheet supplements the full-size frames, never replaces them.
  const thumbWidth = view.name === "desktop" ? 360 : 156,
    thumbHeight = view.name === "desktop" ? 225 : 338
  if (images.length)
    await sharp({
      create: {
        width: thumbWidth * 5,
        height: thumbHeight * 4,
        channels: 3,
        background: "#121212",
      },
    })
      .composite(
        await Promise.all(
          images.map(async (file, i) => ({
            input: await sharp(file).resize(thumbWidth, thumbHeight).toBuffer(),
            left: (i % 5) * thumbWidth,
            top: Math.floor(i / 5) * thumbHeight,
          }))
        )
      )
      .webp({ quality: 85 })
      .toFile(`${output}/${view.name}-beats.webp`)
  for (const quality of ["medium", "low", "high"]) {
    await page.evaluate(
      async (q) => (await import("/src/experience/quality.ts")).forceQuality(q),
      quality
    )
    await seek("banner-2", 0.7)
    viewReport.beats.push({ quality, ...(await sample()) })
  }
  for (let cycle = 0; cycle < 3; cycle++) {
    await seek("hero", 0.7)
    await page.waitForTimeout(400)
    viewReport.memory.push({ cycle, ...(await sample()).gpu })
    if (cycle < 2) {
      await seek("naturalis", 0.5)
      await page.evaluate(() => {
        window.a41.canvas = document.querySelector("canvas")
      })
      await page.locator('[data-scene-caption="naturalis"] a').click()
      await page.waitForURL("**/projects/naturalis")
      await page.goBack()
      await page.waitForURL((url) => url.pathname === "/")
      await page.waitForSelector('[data-chapter="hero"]')
      await page.waitForFunction(
        () =>
          window.a41.store.getSnapshot().chapterId === "vibo" &&
          Math.abs(window.a41.store.progress("vibo").current - 0.1) < 0.0004
      )
      await page.waitForTimeout(400)
      assert.equal(
        await page.evaluate(
          () => document.querySelector("canvas") === window.a41.canvas
        ),
        true,
        "Canvas must persist across Astro navigation"
      )
    }
  }
  assert.equal(viewReport.memory.at(-1).mountedScenes, 0)
  assert.equal(
    viewReport.memory.at(-1).geometries,
    viewReport.memory[0].geometries
  )
  assert.equal(viewReport.memory.at(-1).textures, viewReport.memory[0].textures)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.waitForTimeout(500)
  assert.equal(await page.locator("[data-experience-stage] canvas").count(), 0)
  viewReport.reducedMotion = "static, sin canvas"
  report.views.push(viewReport)
  await writeFile(
    `${output}/${process.env.A41_ONLY === "memory" ? "memoria" : "metricas"}.json`,
    JSON.stringify(report, null, 2)
  )
  await page.close()
  console.log(
    `${view.name}: ${process.env.A41_ONLY === "memory" ? "memoria y navegación" : "beats, handoffs y memoria"} comprobados`
  )
}
await browser.close()
report.warnings = [...new Set(report.warnings)]
await writeFile(
  `${output}/${process.env.A41_ONLY === "memory" ? "memoria" : "metricas"}.json`,
  JSON.stringify(report, null, 2)
)
assert.deepEqual(report.errors, [])
console.log(
  JSON.stringify(
    report.views.map((v) => ({
      view: v.name,
      joins: v.joins,
      motion: v.motion,
    })),
    null,
    2
  )
)
