import { expect, type Page, test } from "@playwright/test";

/**
 * Fluxo de convite, ponta a ponta.
 *
 * Exige sessão de admin, então é pulado sem credencial — como
 * `shell.spec.ts`. Ver `supabase/seed/README.md`.
 *
 * O teste **cria dado real** e por isso se limpa: revoga o convite ao final, e
 * revoga qualquer resíduo no início, para ser idempotente mesmo depois de uma
 * execução interrompida.
 *
 * O e-mail usado é de domínio reservado para exemplo (RFC 2606), então mesmo
 * com envio ligado nada sairia para uma caixa de verdade.
 */

const EMAIL = process.env.E2E_EMAIL;
const SENHA = process.env.E2E_SENHA;

/**
 * E-mail por projeto.
 *
 * Desktop e tablet rodam em paralelo, e o índice parcial
 * `invitations_pendente_unico` permite um convite pendente por e-mail e
 * clínica — com endereço fixo, um projeto derruba o outro. O sufixo elimina a
 * corrida sem serializar a suíte.
 */
function emailDoConvidado(projeto: string): string {
  return `convidada.teste+${projeto}@example.com`;
}

/** A linha da tabela do convidado, sem casar com o texto do banner de aviso. */
function linhaDoConvidado(page: Page, convidado: string) {
  return page.getByRole("row").filter({ hasText: convidado });
}

test.beforeEach(async ({ page }) => {
  test.skip(!EMAIL || !SENHA, "E2E_EMAIL e E2E_SENHA não configurados.");

  await page.goto("/login");
  await page.getByLabel(/^E-mail profissional\*?$/).fill(EMAIL!);
  await page.getByLabel(/^Senha\*?$/).fill(SENHA!);
  await page.getByRole("button", { name: "Entrar no Serenitá" }).click();
  await page.waitForURL(/\/dashboard$/);
});

test("convite: gerar link, abrir sem sessão e revogar", async ({
  page,
  browser,
}, info) => {
  const CONVIDADO = emailDoConvidado(info.project.name);

  await page.goto("/configuracoes/usuarios");
  await expect(
    page.getByRole("heading", { name: "Membros da Clínica" }),
  ).toBeVisible();

  // Idempotência: execução anterior interrompida pode ter deixado convite
  // pendente, e o índice parcial recusaria o duplicado.
  if (await linhaDoConvidado(page, CONVIDADO).count()) {
    await linhaDoConvidado(page, CONVIDADO)
      .getByRole("button", { name: "Cancelar convite" })
      .click();
    await expect(linhaDoConvidado(page, CONVIDADO)).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Convidar Usuário" }).click();
  await page.getByLabel(/^E-mail\*?$/).fill(CONVIDADO);
  await page.getByRole("button", { name: "Enviar convite" }).click();

  // Com o adaptador de console o e-mail não sai de verdade, então o link
  // precisa continuar visível para repasse manual.
  const campoDoLink = page.getByLabel("Link do convite");
  await expect(campoDoLink).toBeVisible();

  const link = await campoDoLink.inputValue();
  expect(link).toContain("/convite/");

  // Aparece como pendente. Escopado à linha: o e-mail também está no banner.
  await expect(linhaDoConvidado(page, CONVIDADO)).toBeVisible();
  // `exact`: a primeira célula diz "Convite Pendente" e o badge diz "Pendente".
  await expect(
    linhaDoConvidado(page, CONVIDADO).getByText("Pendente", { exact: true }),
  ).toBeVisible();

  const caminho = new URL(link).pathname;

  // --- O admin logado NÃO pode aceitar um convite de outro e-mail ----------
  // O bloqueio real está em `accept_invitation`; a tela explica antes, para a
  // pessoa não bater num erro sem saída.
  await page.goto(caminho);
  await expect(
    page.getByRole("heading", { name: "Conta diferente" }),
  ).toBeVisible();

  // --- Quem chega sem sessão vê o convite ----------------------------------
  // É o caminho real do convidado, e prova que o token gravado corresponde ao
  // emitido — a busca é por SHA-256, então um token errado não acharia nada.
  const contextoLimpo = await browser.newContext();
  const visitante = await contextoLimpo.newPage();
  try {
    const resposta = await visitante.goto(caminho);
    expect(resposta?.status()).toBe(200);
    // Rota pública: sem sessão não pode cair no login.
    await expect(visitante).not.toHaveURL(/\/login/);

    await expect(
      visitante.getByRole("heading", { name: /^Convite para / }),
    ).toBeVisible();
    await expect(visitante.getByLabel(/^E-mail do convite\*?$/)).toHaveValue(
      CONVIDADO,
    );
    // Sem conta, o formulário pede senha para criar o acesso.
    await expect(
      visitante.getByRole("button", { name: "Criar acesso e entrar" }),
    ).toBeVisible();
  } finally {
    await contextoLimpo.close();
  }

  // --- Limpeza -------------------------------------------------------------
  await page.goto("/configuracoes/usuarios");
  await linhaDoConvidado(page, CONVIDADO)
    .getByRole("button", { name: "Cancelar convite" })
    .click();

  await expect(linhaDoConvidado(page, CONVIDADO)).toHaveCount(0);
});
