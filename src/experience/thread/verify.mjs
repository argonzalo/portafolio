import { chromium } from "@playwright/test"
import assert from "node:assert/strict"
const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text())
})
await page.goto(
  "http://127.0.0.1:3013/?chapter=vibo&progress=0.45&quality=high&debug"
)
await page.waitForTimeout(5000)
const read = () =>
  page.evaluate(async () => {
    const { getGpuStats } = await import("/src/experience/gpuStats.ts")
    const { experienceStore } = await import("/src/experience/store.ts")
    const { threadTip } = await import("/src/experience/thread/runtime.ts")
    return {
      gpu: getGpuStats(),
      progress: experienceStore.progress("vibo").current,
      tip: threadTip.position.toArray(),
      visible: threadTip.visible,
    }
  })
const before = await read()
assert.equal(before.gpu.calls, 1)
await page.evaluate(() => {
  window.originalCanvas = document.querySelector("canvas")
})
for (let i = 0; i < 5; i++) {
  for (const path of [
    "/projects/vibo",
    "/?chapter=vibo&progress=0.45&quality=high&debug",
  ]) {
    await page.evaluate((path) => {
      const a = document.createElement("a")
      a.href = path
      document.body.append(a)
      a.click()
      a.remove()
    }, path)
    await page.waitForTimeout(700)
    assert(
      await page.evaluate(
        () => window.originalCanvas === document.querySelector("canvas")
      )
    )
  }
}

await page.evaluate(() => {
  window.originalCanvas = document.querySelector("canvas")
})
for (let i = 0; i < 5; i++) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(700)
  assert.equal((await read()).gpu.calls, 2)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(700)
  assert.equal((await read()).gpu.geometries, 1)
}
assert(
  await page.evaluate(
    () => window.originalCanvas === document.querySelector("canvas")
  )
)
await page.locator("button").getByText("low", { exact: true }).click()
await page.waitForTimeout(800)
assert.equal((await read()).gpu.triangles, 280)
await page.locator("button").getByText("static", { exact: true }).click()
await page.waitForTimeout(800)
assert.equal(await page.locator("canvas").count(), 0)
assert.equal((await read()).visible, false)
await page.emulateMedia({ reducedMotion: "reduce" })
await page.reload()
await page.waitForTimeout(1000)
assert.equal(await page.locator("canvas").count(), 0)
console.log("Final GPU state", await read())
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
console.log(
  "PASS: renderers, 5 resize cycles, GPU baseline, persistent canvas, low, static, reduced motion, custom anchors."
)
await browser.close()
