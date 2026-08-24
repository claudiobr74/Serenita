import { expect, type Page, test } from "@playwright/test";

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

const EMAIL = process.env.E2E_EMAIL;
const SENHA = process.env.E2E_SENHA;

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

async function entrar(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/^E-mail profissional\*?$/).fill(EMAIL!);
  await page.getByLabel(/^Senha\*?$/).fill(SENHA!);
  await page.getByRole("button", { name: "Entrar no Serenitá" }).click();
  await page.waitForURL(/\/dashboard$/);
}

test.beforeEach(async ({ page }) => {
  test.skip(!EMAIL || !SENHA, "E2E_EMAIL e E2E_SENHA não configurados.");
  await entrar(page);
});

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
