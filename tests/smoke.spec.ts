import { expect, test } from "@playwright/test"

test.describe("smoke", () => {
  test("la home responde y muestra el spike del runtime", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.ok()).toBeTruthy()
    await expect(page.getByText("Spike T-A06").first()).toBeVisible()
    await expect(page.getByText("Canvas persistente").first()).toBeVisible()
  })

  test("la lista de proyectos carga", async ({ page }) => {
    const response = await page.goto("/projects")
    expect(response?.ok()).toBeTruthy()
    await expect(page.locator("body")).toBeVisible()
  })
})
