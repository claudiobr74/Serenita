import { describe, expect, it } from "vitest";

import { escaparCuringa, interpretarBusca } from "./busca";

describe("interpretarBusca", () => {
  it("vazio", () => {
    expect(interpretarBusca("").tipo).toBe("vazio");
    expect(interpretarBusca("   ").tipo).toBe("vazio");
    expect(interpretarBusca(null).tipo).toBe("vazio");
  });

  it("nome é texto", () => {
    expect(interpretarBusca("Ana Beatriz")).toEqual({
      tipo: "texto",
      valor: "Ana Beatriz",
    });
  });

  it("CPF com máscara vira dígitos", () => {
    const r = interpretarBusca("111.444.777-35");
    expect(r.tipo).toBe("digitos");
    if (r.tipo === "digitos") expect(r.valor).toBe("11144477735");
  });

  it("telefone com máscara vira dígitos", () => {
    const r = interpretarBusca("(11) 99999-0000");
    expect(r.tipo).toBe("digitos");
    if (r.tipo === "digitos") expect(r.valor).toBe("11999990000");
  });

  /** Nome com um número no meio continua sendo nome. */
  it("texto com poucos dígitos não vira documento", () => {
    expect(interpretarBusca("Ana 2").tipo).toBe("texto");
  });

  it("menos de 3 dígitos não vira documento", () => {
    expect(interpretarBusca("11").tipo).toBe("texto");
  });
});

describe("escaparCuringa", () => {
  /**
   * Sem escape, `%` casaria com todo mundo — o usuário veria resultado errado
   * sem entender por quê.
   */
  it("escapa os curingas do LIKE", () => {
    expect(escaparCuringa("100%")).toBe("100\\%");
    expect(escaparCuringa("a_b")).toBe("a\\_b");
    expect(escaparCuringa("a\\b")).toBe("a\\\\b");
  });

  it("não mexe em texto comum", () => {
    expect(escaparCuringa("Ana Beatriz")).toBe("Ana Beatriz");
  });
});
