import { describe, expect, it } from "vitest";

import { DESTINO_PADRAO, destinoSeguro } from "./redirect";

/**
 * O login é a superfície mais visada por phishing, e `next` é entrada de
 * usuário. Cada caso aqui é um vetor real de open redirect.
 */
describe("destinoSeguro", () => {
  it("aceita caminho relativo", () => {
    expect(destinoSeguro("/pacientes")).toBe("/pacientes");
    expect(destinoSeguro("/pacientes/123?tab=plano")).toBe(
      "/pacientes/123?tab=plano",
    );
  });

  it("cai no padrão sem valor", () => {
    expect(destinoSeguro(undefined)).toBe(DESTINO_PADRAO);
    expect(destinoSeguro(null)).toBe(DESTINO_PADRAO);
    expect(destinoSeguro("")).toBe(DESTINO_PADRAO);
  });

  it.each([
    ["https://exemplo.com", "URL absoluta"],
    ["http://exemplo.com", "URL absoluta sem TLS"],
    ["//exemplo.com", "protocol-relative"],
    ["/\\exemplo.com", "barra invertida normalizada para //"],
    ["javascript:alert(1)", "pseudo-protocolo"],
    ["data:text/html,<script>", "data URI"],
  ])("rejeita %s (%s)", (entrada) => {
    expect(destinoSeguro(entrada)).toBe(DESTINO_PADRAO);
  });
});
