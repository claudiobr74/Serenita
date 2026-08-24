import { expect, test } from "@playwright/test";

/**
 * Guard de autenticação e tela de login.
 *
 * Estes testes rodam SEM sessão, que é o estado em que o CI opera: não
 * dependem de banco nem de credencial, e por isso valem como gate.
 */

test("rota protegida sem sessão vai para o login", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("button", { name: "Entrar no Serenitá" }),
  ).toBeVisible();
});

test("o destino original é preservado em `next`", async ({ page }) => {
  await page.goto("/pacientes/123");

  // Preservar o destino é o que faz o login devolver o usuário onde ele estava.
  await expect(page).toHaveURL(/next=%2Fpacientes%2F123/);
});

test("a raiz sem sessão termina no login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("o login mostra os campos e as ações do frame", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByLabel(/^E-mail profissional\*?$/)).toBeVisible();
  await expect(page.getByLabel(/^Senha\*?$/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar no Serenitá" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /link de acesso/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Esqueci minha senha" }),
  ).toBeVisible();
});

test("o olho revela e oculta a senha", async ({ page }) => {
  await page.goto("/login");

  const senha = page.getByLabel(/^Senha\*?$/);
  await senha.fill("segredo123");
  await expect(senha).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(senha).toHaveAttribute("type", "text");

  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(senha).toHaveAttribute("type", "password");
});

test("Google fica desabilitado até a Fase 5", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("button", { name: "Continuar com Google" }),
  ).toBeDisabled();
});

test("a recuperação de senha é alcançável a partir do login", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();

  await expect(page).toHaveURL(/\/recuperar$/);
  await expect(
    page.getByRole("heading", { name: "Recuperar senha" }),
  ).toBeVisible();
});

test("as rotas públicas de auth não entram em laço de redirecionamento", async ({
  page,
}) => {
  // Um proxy mal configurado que redirecionasse /login para /login derrubaria
  // a aplicação inteira. Vale um teste explícito.
  for (const rota of ["/login", "/recuperar"]) {
    const resposta = await page.goto(rota);
    expect(resposta?.status(), `${rota} deve responder 200`).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${rota}$`));
  }
});

test("o logo e o brilho de fundo carregam", async ({ page }) => {
  await page.goto("/login");

  // O logo é decorativo (alt=""), então é localizado pelo src otimizado.
  const logo = page.locator('img[src*="logomark"]');
  await expect(logo).toBeVisible();

  // `naturalWidth > 0` prova que o arquivo carregou, e não que só o <img>
  // existe — um caminho errado renderiza o elemento e nenhum pixel.
  await expect
    .poll(() => logo.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);

  const brilho = page.locator('img[src*="login-glow"]');
  await expect
    .poll(() => brilho.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
});

test("convite inválido não vira oráculo nem exige sessão", async ({ page }) => {
  // A rota é pública de propósito: quem chega ainda não tem conta. Se o proxy
  // a tratasse como protegida, o convidado seria mandado ao login e nunca
  // conseguiria aceitar — o fluxo inteiro morreria aqui.
  const resposta = await page.goto("/convite/token-que-nao-existe");

  expect(resposta?.status()).toBe(200);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Convite indisponível" }),
  ).toBeVisible();

  // Token cancelado, já usado e inexistente precisam ser indistinguíveis.
  await expect(page.getByText(/não é mais válido/i)).toBeVisible();
});
