import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { expect, test as setup } from "@playwright/test";

import { ARQUIVO_DE_SESSAO } from "./sessao";

/**
 * Autentica **uma vez** e guarda o estado para os demais testes.
 *
 * Antes disto cada teste fazia o próprio `signInWithPassword`, e o Supabase
 * Auth limita a taxa de login. Em execuções seguidas da suíte a cota estourava
 * e os testes falhavam por tempo esgotado — um modo de falha que não é defeito
 * do produto, e que custa caro justamente porque parece um.
 *
 * Também é mais rápido: um login em vez de um por teste.
 *
 * `auth.spec.ts` NÃO usa este estado, de propósito: ele testa o comportamento
 * sem sessão.
 */

const EMAIL = process.env.E2E_EMAIL;
const SENHA = process.env.E2E_SENHA;

setup("autentica uma vez", async ({ page }) => {
  mkdirSync(dirname(ARQUIVO_DE_SESSAO), { recursive: true });

  if (!EMAIL || !SENHA) {
    // Sem credencial, grava um estado vazio. Os specs que exigem sessão têm o
    // próprio `test.skip`; sem o arquivo, o Playwright falharia ao montar o
    // projeto — o que esconderia o motivo real.
    if (!existsSync(ARQUIVO_DE_SESSAO)) {
      writeFileSync(
        ARQUIVO_DE_SESSAO,
        JSON.stringify({ cookies: [], origins: [] }),
      );
    }
    return;
  }

  await page.goto("/login");
  await page.getByLabel(/^E-mail profissional\*?$/).fill(EMAIL);
  await page.getByLabel(/^Senha\*?$/).fill(SENHA);
  await page.getByRole("button", { name: "Entrar no Serenitá" }).click();
  await page.waitForURL(/\/dashboard$/);

  // Confirma que a sessão vale de fato antes de gravá-la: um arquivo com
  // cookie inválido faria todos os testes falharem de forma confusa.
  await expect(
    page.getByRole("navigation", { name: "Navegação principal" }),
  ).toBeVisible();

  await page.context().storageState({ path: ARQUIVO_DE_SESSAO });
});
