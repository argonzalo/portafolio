import { expect, test } from "@playwright/test"

test.describe("smoke", () => {
  test("la home responde y muestra el recorrido", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.ok()).toBeTruthy()
    await expect(
      page.getByRole("heading", { name: "Tu próxima gran idea hecha realidad" })
    ).toBeVisible()
    await expect(page.locator('[data-chapter="hero"]')).toBeVisible()
  })

  test("la lista de proyectos carga", async ({ page }) => {
    const response = await page.goto("/projects")
    expect(response?.ok()).toBeTruthy()
    await expect(
      page.getByRole("heading", { name: "Vista lista" })
    ).toBeVisible()
  })
})
