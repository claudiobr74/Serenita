import { expect, test } from "@playwright/test";

import { ARQUIVO_DE_SESSAO, TEM_CREDENCIAL } from "./sessao";

/**
 * Reusa a sessão gravada por `auth.setup.ts`: um login para a suíte inteira,
 * em vez de um por teste. Ver o comentário lá sobre limite de taxa.
 */
test.use({ storageState: ARQUIVO_DE_SESSAO });

test.beforeEach(() => {
  test.skip(!TEM_CREDENCIAL, "E2E_EMAIL e E2E_SENHA não configurados.");
});

/**
 * Lista e cadastro de pacientes.
 *
 * Exige sessão, como `shell.spec.ts`. **Cria dado real** e por isso se limpa:
 * arquiva o paciente ao final — não apaga, porque `patients` não tem policy de
 * DELETE, o que é proposital.
 *
 * O CPF é gerado por projeto, com dígitos verificadores válidos: desktop e
 * tablet rodam em paralelo e o índice `patients_cpf_unico` é por clínica.
 */

/** Calcula os dois verificadores para uma base de 9 dígitos. */
function cpfComVerificadores(base9: string): string {
  const dv = (parcial: string, pesoInicial: number) => {
    const soma = parcial
      .split("")
      .reduce((acc, c, i) => acc + Number(c) * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = dv(base9, 10);
  const d2 = dv(`${base9}${d1}`, 11);
  return `${base9}${d1}${d2}`;
}

test("cadastrar paciente gera PAC-### e ele aparece na lista", async ({
  page,
}, info) => {
  // Base distinta por projeto para não colidir no índice de CPF.
  const cpf = cpfComVerificadores(
    info.project.name === "desktop" ? "111444777" : "222555888",
  );
  const nome = `Paciente E2E ${info.project.name}`;

  // Idempotência: execução anterior interrompida pode ter deixado o paciente,
  // e o índice `patients_cpf_unico` recusaria o duplicado.
  await page.goto("/pacientes");
  const residuo = page.getByRole("row").filter({ hasText: nome });
  test.skip(
    (await residuo.count()) > 0,
    "Paciente de execução anterior ainda existe. `patients` não tem DELETE por " +
      "design; remova-o no banco antes de repetir.",
  );

  await page.goto("/pacientes/novo");
  await expect(
    page.getByRole("heading", { name: "1. Dados Pessoais" }),
  ).toBeVisible();

  await page.getByLabel(/^Nome Completo\*?$/).fill(nome);
  await page.getByLabel(/^Data de Nascimento\*?$/).fill("1990-05-14");
  await page.getByLabel(/^CPF\*?$/).fill(cpf);
  await page.getByLabel(/^Telefone\*?$/).fill("(11) 99999-0000");

  await page.getByRole("button", { name: "Salvar Paciente" }).click();
  await page.waitForURL(/\/pacientes$/);

  const linha = page.getByRole("row").filter({ hasText: nome });
  await expect(linha).toBeVisible();

  // O código é gerado pelo servidor, nunca enviado pelo formulário.
  await expect(linha.getByText(/^PAC-\d{3}$/)).toBeVisible();

  // `03 — PATTERNS` exige CPF mascarado na tela: os seis primeiros dígitos
  // não podem aparecer.
  await expect(linha).not.toContainText(cpf.slice(0, 6));
  await expect(linha.getByText(/•••\.•••\./)).toBeVisible();

  // Limpeza: arquiva, já que não há DELETE — e é proposital que não haja.
  await linha.getByRole("button", { name: "Arquivar" }).click();

  // O filtro padrão é "Todos", então o paciente CONTINUA na lista — o que muda
  // é o status. Esperar que ele suma aqui seria confundir arquivar com apagar.
  await expect(linha.getByText("Arquivado")).toBeVisible();
  await expect(linha.getByRole("button", { name: "Reativar" })).toBeVisible();

  // Sai de Ativos e entra em Arquivados.
  await page.goto("/pacientes?status=active");
  await expect(page.getByRole("row").filter({ hasText: nome })).toHaveCount(0);
  await page.goto("/pacientes?status=archived");
  await expect(page.getByRole("row").filter({ hasText: nome })).toBeVisible();
});

test("busca por nome filtra a lista", async ({ page }) => {
  await page.goto("/pacientes");

  await page.getByLabel(/^Buscar paciente\*?$/).fill("zzz-inexistente");
  // Debounce de 300ms; o `toBeVisible` espera pelo resultado.
  // O título do EmptyState é um `<p>`, não um heading — decisão da Fase 2.
  await expect(page.getByText("Nenhum paciente encontrado")).toBeVisible();

  // A busca vive na URL, então é compartilhável e sobrevive ao recarregar.
  await expect(page).toHaveURL(/q=zzz-inexistente/);
});

test("filtro de status é refletido na URL", async ({ page }) => {
  await page.goto("/pacientes");

  await page.getByRole("button", { name: "Arquivados" }).click();
  await expect(page).toHaveURL(/status=archived/);
  await expect(
    page.getByRole("button", { name: "Arquivados" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("perfil do paciente: banner, tabs e conteúdo por papel", async ({
  page,
}, info) => {
  const cpf = cpfComVerificadores(
    info.project.name === "desktop" ? "333666999" : "444777222",
  );
  const nome = `Perfil E2E ${info.project.name}`;

  await page.goto("/pacientes");
  test.skip(
    (await page.getByRole("row").filter({ hasText: nome }).count()) > 0,
    "Paciente de execução anterior ainda existe; veja docs/TESTING.md.",
  );

  // Cadastra com acolhimento clínico, o que exige a sessão ser de psicólogo.
  await page.goto("/pacientes/novo");
  await page.getByLabel(/^Nome Completo\*?$/).fill(nome);
  await page.getByLabel(/^Data de Nascimento\*?$/).fill("1996-03-10");
  await page.getByLabel(/^CPF\*?$/).fill(cpf);
  await page.getByLabel(/^Telefone\*?$/).fill("(11) 98888-0000");
  await page.getByRole("button", { name: "Salvar Paciente" }).click();
  await page.waitForURL(/\/pacientes$/);

  const linha = page.getByRole("row").filter({ hasText: nome });
  await linha.getByRole("link", { name: "Ver Perfil" }).click();

  // --- Banner (6:843) -----------------------------------------------------
  await expect(page.getByRole("heading", { name: nome })).toBeVisible();
  await expect(page.getByText(/^PAC-\d{3}$/)).toBeVisible();
  // Idade é derivada da data de nascimento, não digitada.
  await expect(page.getByText(/Idade: \d+ anos/)).toBeVisible();

  // --- Tabs (6:869) -------------------------------------------------------
  const tabs = page.getByRole("navigation", { name: "Seções do paciente" });
  await expect(tabs.getByRole("link", { name: "Resumo" })).toBeVisible();

  // A tab de Prontuário só existe para quem tem acesso clínico. O usuário do
  // e2e é admin, então ela NÃO deve aparecer — é a RBAC visível na navegação.
  await expect(tabs.getByRole("link", { name: "Prontuário" })).toHaveCount(0);
  await expect(tabs.getByRole("link", { name: "Financeiro" })).toBeVisible();

  // --- Conteúdo por papel -------------------------------------------------
  // Admin vê o cadastro, não o clínico, e a tela diz isso em vez de ficar vazia.
  await expect(
    page.getByRole("heading", { name: "Dados cadastrais" }),
  ).toBeVisible();
  await expect(
    page.getByText(/não é acessível ao seu nível de acesso/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Acolhimento inicial" }),
  ).toHaveCount(0);

  // CPF mascarado, como 03 — PATTERNS exige.
  await expect(page.getByText(/•••\.•••\./)).toBeVisible();
  await expect(page.getByText(cpf.slice(0, 6))).toHaveCount(0);

  // --- Navegar entre tabs -------------------------------------------------
  await tabs.getByRole("link", { name: "Financeiro" }).click();
  await expect(page).toHaveURL(/\/financeiro$/);

  // Limpeza.
  await page.goto("/pacientes");
  await page
    .getByRole("row")
    .filter({ hasText: nome })
    .getByRole("button", { name: "Arquivar" })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: nome }).getByText("Arquivado"),
  ).toBeVisible();
});

test("id inexistente não revela nada", async ({ page }) => {
  // Inexistente e invisível-sob-RLS precisam ser indistinguíveis: distinguir
  // confirmaria a existência do paciente a quem não pode vê-lo.
  const resposta = await page.goto(
    "/pacientes/00000000-0000-0000-0000-000000000000",
  );
  expect(resposta?.status()).toBe(404);
});
