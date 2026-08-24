import { describe, expect, it } from "vitest";

import { classificarErro, MENSAGEM } from "./errors";

describe("classificarErro", () => {
  it("reconhece rate limit por status e por código", () => {
    expect(classificarErro({ status: 429 })).toBe("limite_de_tentativas");
    expect(classificarErro({ code: "over_request_rate_limit" })).toBe(
      "limite_de_tentativas",
    );
  });

  it("reconhece credencial inválida", () => {
    expect(classificarErro({ code: "invalid_credentials" })).toBe(
      "credenciais_invalidas",
    );
    expect(classificarErro({ message: "Invalid login credentials" })).toBe(
      "credenciais_invalidas",
    );
  });

  it("reconhece link expirado", () => {
    expect(classificarErro({ code: "otp_expired" })).toBe("link_expirado");
    expect(
      classificarErro({ message: "Email link is invalid or has expired" }),
    ).toBe("link_expirado");
  });

  it("cai em indisponível quando não reconhece", () => {
    expect(classificarErro({ message: "boom" })).toBe("indisponivel");
    expect(classificarErro({})).toBe("indisponivel");
  });

  it("o código tem precedência sobre o texto", () => {
    // Rate limit vence, porque é o que o usuário precisa saber para agir.
    expect(
      classificarErro({ status: 429, message: "Invalid login credentials" }),
    ).toBe("limite_de_tentativas");
  });

  /**
   * Regra de segurança: a mensagem de credencial inválida não pode revelar
   * QUAL metade falhou, senão o formulário vira oráculo de enumeração de
   * contas. Este teste falha se alguém "melhorar" a cópia.
   */
  it("não revela se o e-mail existe", () => {
    const texto = MENSAGEM.credenciais_invalidas.toLowerCase();
    expect(texto).not.toContain("não encontrado");
    expect(texto).not.toContain("não existe");
    expect(texto).not.toContain("cadastrad");
  });
});
