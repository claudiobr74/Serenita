import { expect, test } from "@playwright/test";

/**
 * Smoke do App Shell.
 *
 * Fase 1: valida que o chrome renderiza e navega. Os fluxos obrigatórios de
 * `docs/TESTING.md` chegam com as telas que eles exercitam.
 */

test("shell renderiza a navegação e o dashboard", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hoje no Serenitá" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bom dia, Dra. Mariana" }),
  ).toBeVisible();
});

test("a raiz redireciona para o dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("navegar pela sidebar marca o item ativo", async ({ page }) => {
  await page.goto("/dashboard");

  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await nav.getByRole("link", { name: "Pacientes" }).click();

  await expect(page).toHaveURL(/\/pacientes$/);
  await expect(nav.getByRole("link", { name: "Pacientes" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("todo item da sidebar leva a uma rota que responde", async ({ page }) => {
  await page.goto("/dashboard");

  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  const hrefs = await nav
    .getByRole("link")
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((h): h is string => !!h),
    );

  expect(hrefs.length).toBeGreaterThan(1);

  for (const href of hrefs) {
    const response = await page.goto(href);
    expect(response?.status(), `${href} deve responder 200`).toBe(200);
  }
});
