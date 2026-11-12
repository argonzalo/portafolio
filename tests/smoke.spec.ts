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

  test("el acceso a proyectos abre la lista y reinicia el detalle al cerrar", async ({
    page,
  }) => {
    const response = await page.goto("/projects")
    expect(response?.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/#archive$/)
    const open = page.getByRole("button", { name: "Abrir lista de proyectos" })
    await open.click()
    const dialog = page.getByRole("dialog")
    await expect(
      dialog.getByRole("heading", { name: "Proyectos", exact: true })
    ).toBeVisible()
    await dialog.getByRole("button", { name: /^Ver detalles de Vibo/i }).click()
    await expect(
      dialog.getByRole("button", { name: "Volver a la lista de proyectos" })
    ).toBeVisible()
    await dialog
      .getByRole("button", { name: "Cerrar detalle del proyecto" })
      .click()
    await open.click()
    await expect(
      dialog.getByRole("heading", { name: "Proyectos", exact: true })
    ).toBeVisible()
  })
})
