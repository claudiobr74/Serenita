import { describe, expect, it } from "vitest";

import { montarConvite } from "./convite";

const BASE = {
  clinica: "Espaço Serenità",
  papel: "psychologist" as const,
  link: "https://serenita.app/convite/abc123",
  expiraEm: new Date("2026-09-01T12:00:00Z"),
};

describe("montarConvite", () => {
  it("traz clínica, papel, link e prazo nas duas versões", () => {
    const { assunto, texto, html } = montarConvite(BASE);

    expect(assunto).toContain("Espaço Serenità");
    for (const corpo of [texto, html]) {
      expect(corpo).toContain("Espaço Serenità");
      expect(corpo).toContain(BASE.link);
    }
    expect(texto).toContain("Psicólogo");
    expect(texto).toContain("setembro");
  });

  it("inclui quem convidou quando informado, e omite quando não", () => {
    expect(
      montarConvite({ ...BASE, convidadoPor: "Dra. Mariana" }).texto,
    ).toContain("por Dra. Mariana");
    expect(montarConvite(BASE).texto).not.toContain("por ");
  });

  /**
   * O nome da clínica é entrada de usuário e vai direto no corpo HTML.
   * Sem escape, um admin poderia injetar marcação no e-mail de quem convida.
   */
  it("escapa HTML no nome da clínica", () => {
    const { html } = montarConvite({
      ...BASE,
      clinica: '<script>alert("x")</script>',
    });

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  /**
   * Regra inviolável do ADR 005: e-mail repousa em servidor de terceiro, fora
   * da RLS. Este teste é a rede de proteção contra alguém "enriquecer" o
   * convite no futuro.
   */
  it("não carrega vocabulário clínico", () => {
    const { assunto, texto, html } = montarConvite(BASE);
    const proibido = [
      "paciente",
      "prontuário",
      "prontuario",
      "sessão clínica",
      "diagnóstico",
      "transcrição",
      "anamnese",
      "plano terapêutico",
    ];

    for (const corpo of [assunto, texto, html]) {
      for (const termo of proibido) {
        expect(corpo.toLowerCase()).not.toContain(termo);
      }
    }
  });

  it("o texto puro não é HTML disfarçado", () => {
    // Cliente sem HTML precisa de algo legível, não de marcação crua.
    expect(montarConvite(BASE).texto).not.toMatch(/<[a-z]+[\s>]/i);
  });
});
