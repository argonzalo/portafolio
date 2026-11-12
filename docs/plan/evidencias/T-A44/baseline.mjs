import { chromium } from "@playwright/test"
import { writeFile } from "node:fs/promises"

const browser = await chromium.launch({ channel: "chrome", headless: true })
const results = []
for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
]) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: name === "mobile",
    hasTouch: name === "mobile",
  })
  await page.goto("http://127.0.0.1:3010/?quality=medium", {
    waitUntil: "networkidle",
  })
  await page.waitForSelector("[data-experience-stage] canvas")
  results.push({
    name,
    chapters: await page
      .locator("[data-chapter]")
      .evaluateAll((nodes) =>
        nodes.map((el) => ({ id: el.dataset.chapter, height: el.offsetHeight }))
      ),
  })
  await page.close()
}
await browser.close()
await writeFile(
  new URL("./baseline.json", import.meta.url),
  JSON.stringify(results, null, 2)
)
console.log(JSON.stringify(results))
