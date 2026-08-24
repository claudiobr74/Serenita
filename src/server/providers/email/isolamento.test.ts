import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * O fornecedor de e-mail vive num lugar só.
 *
 * Espelha a verificação que o ADR 003 exige do fornecedor de IA: se a chave da
 * API ou o host aparecerem fora de `server/providers/email/`, a abstração
 * vazou, e trocar de fornecedor deixa de ser reescrever um arquivo.
 *
 * O teste varre o código de verdade, em vez de confiar em disciplina.
 */

const RAIZ = join(process.cwd(), "src");
const PERMITIDO = join("src", "server", "providers", "email");

const MARCAS_DO_FORNECEDOR = ["RESEND_API_KEY", "api.resend.com", "resend.com"];

function arquivosDeCodigo(diretorio: string): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(diretorio)) {
    const caminho = join(diretorio, entrada);
    if (statSync(caminho).isDirectory()) {
      encontrados.push(...arquivosDeCodigo(caminho));
    } else if (/\.(ts|tsx|mts)$/.test(entrada)) {
      encontrados.push(caminho);
    }
  }

  return encontrados;
}

describe("isolamento do fornecedor de e-mail", () => {
  it("só `server/providers/email/` conhece o fornecedor", () => {
    const vazamentos: string[] = [];

    for (const arquivo of arquivosDeCodigo(RAIZ)) {
      const caminhoRelativo = join("src", relative(RAIZ, arquivo));
      if (caminhoRelativo.startsWith(PERMITIDO + sep)) continue;

      const conteudo = readFileSync(arquivo, "utf8");
      for (const marca of MARCAS_DO_FORNECEDOR) {
        if (conteudo.includes(marca)) {
          vazamentos.push(`${caminhoRelativo}: "${marca}"`);
        }
      }
    }

    expect(vazamentos).toEqual([]);
  });

  it("o domínio não importa a porta de envio", () => {
    // `domain/email/` monta a mensagem e nada mais. Se ele passar a enviar,
    // a regra de "nada clínico sai por e-mail" fica sem um ponto único de
    // aplicação.
    const dominio = join(RAIZ, "domain", "email");
    for (const arquivo of arquivosDeCodigo(dominio)) {
      const conteudo = readFileSync(arquivo, "utf8");
      expect(conteudo).not.toContain("server/providers");
      expect(conteudo).not.toContain("obterEmailProvider");
    }
  });
});
