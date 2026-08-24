import { describe, expect, it } from "vitest";

import { apenasDigitos, cpfValido, mascararCpf, ocultarCpf } from "./cpf";

describe("mascararCpf", () => {
  it("formata 11 dígitos", () => {
    expect(mascararCpf("11144477735")).toBe("111.444.777-35");
  });

  it("devolve como veio se não tiver 11 dígitos", () => {
    expect(mascararCpf("111")).toBe("111");
  });
});

describe("ocultarCpf", () => {
  /**
   * `03 — PATTERNS` exige CPF mascarado na tela. Os três últimos dígitos antes
   * do verificador bastam para conferir a pessoa sem expor o documento a quem
   * passa pela tela.
   */
  it("mantém apenas o final", () => {
    expect(ocultarCpf("11144477735")).toBe("•••.•••.777-35");
  });

  it("não vaza nada quando o valor é inválido ou ausente", () => {
    expect(ocultarCpf(null)).toBe("—");
    expect(ocultarCpf("123")).toBe("—");
  });

  it("nunca devolve os primeiros seis dígitos", () => {
    const oculto = ocultarCpf("11144477735");
    expect(oculto).not.toContain("111");
    expect(oculto).not.toContain("444");
  });
});

describe("cpfValido", () => {
  it("aceita CPF com dígitos verificadores corretos", () => {
    expect(cpfValido("11144477735")).toBe(true);
    expect(cpfValido("111.444.777-35")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(cpfValido("11144477736")).toBe(false);
    expect(cpfValido("12345678901")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(cpfValido("1114447773")).toBe(false);
    expect(cpfValido("")).toBe(false);
  });

  it("rejeita sequência repetida", () => {
    for (const d of "0123456789") {
      expect(cpfValido(d.repeat(11))).toBe(false);
    }
  });
});

describe("apenasDigitos", () => {
  it("remove máscara", () => {
    expect(apenasDigitos("111.444.777-35")).toBe("11144477735");
  });
});
