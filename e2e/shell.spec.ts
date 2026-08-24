import { expect, test } from "@playwright/test";

import { ARQUIVO_DE_SESSAO, TEM_CREDENCIAL } from "./sessao";

/**
 * Reusa a sessão gravada por `auth.setup.ts`: um login para a suíte inteira,
 * em vez de um por teste. Ver o comentário lá sobre limite de taxa.
 */
test.use({ storageState: ARQUIVO_DE_SESSAO });

test.beforeEach(async ({ page }) => {
  test.skip(!TEM_CREDENCIAL, "E2E_EMAIL e E2E_SENHA não configurados.");
  // A sessão vem do estado gravado; o que falta é chegar na tela.
  await page.goto("/dashboard");
});

/**
 * Smoke do App Shell.
 *
 * A partir da Fase 3 o shell exige sessão, então estes testes precisam de um
 * usuário real com perfil ativo. Sem credencial configurada eles são pulados —
 * e não silenciosamente: `test.skip` reporta o motivo no relatório.
 *
 * Para rodar:
 *
 *     E2E_EMAIL=... E2E_SENHA=... npm run test:e2e
 *
 * O usuário precisa existir no Supabase do ambiente e ter linha em `profiles`.
 * A semente vive em `supabase/seed/`, junto das tabelas que ela popula.
 */

test("shell renderiza a navegação e o dashboard", async ({ page }) => {
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hoje no Serenitá" }),
  ).toBeVisible();
});

test("navegar pela sidebar marca o item ativo", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Navegação principal" });
  await nav.getByRole("link", { name: "Pacientes" }).click();

  await expect(page).toHaveURL(/\/pacientes$/);
  await expect(nav.getByRole("link", { name: "Pacientes" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("todo item da sidebar leva a uma rota que responde", async ({ page }) => {
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
    // Uma rota que devolvesse o login significaria guard mal configurado.
    await expect(page).not.toHaveURL(/\/login/);
  }
});
