import { describe, expect, it } from "vitest";

import { apenasDigitos, cnpjValido, mascararCnpj } from "./cnpj";

describe("apenasDigitos", () => {
  it("remove máscara", () => {
    expect(apenasDigitos("11.222.333/0001-81")).toBe("11222333000181");
  });
});

describe("mascararCnpj", () => {
  it("formata 14 dígitos como no frame 6:5237", () => {
    expect(mascararCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("devolve como veio se não tiver 14 dígitos", () => {
    expect(mascararCnpj("112")).toBe("112");
  });
});

describe("cnpjValido", () => {
  it("aceita CNPJ com dígitos verificadores corretos", () => {
    expect(cnpjValido("11222333000181")).toBe(true);
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(cnpjValido("11222333000182")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(cnpjValido("1122233300018")).toBe(false);
    expect(cnpjValido("")).toBe(false);
  });

  /**
   * Sequências repetidas passam no módulo 11 e são o caso que uma
   * implementação ingênua deixa entrar.
   */
  it("rejeita sequência repetida", () => {
    expect(cnpjValido("00000000000000")).toBe(false);
    expect(cnpjValido("11111111111111")).toBe(false);
  });
});
