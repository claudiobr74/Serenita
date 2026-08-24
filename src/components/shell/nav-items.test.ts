import { describe, expect, it } from "vitest";

import { NAV_ITEMS, navItemsForRole } from "./nav-items";

describe("navegação da sidebar", () => {
  it("mantém os 11 itens e a ordem medidos no frame Sidebar (6:41)", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Início",
      "Agenda",
      "Pacientes",
      "Sessões",
      "Pendências",
      "Financeiro",
      "Conhecimento",
      "Supervisor IA",
      "Documentos",
      "Indicadores",
      "Configurações",
    ]);
  });

  it("não expõe destinos clínicos a secretary", () => {
    const hrefs = navItemsForRole("secretary").map((item) => item.href);
    expect(hrefs).not.toContain("/sessoes");
    expect(hrefs).not.toContain("/supervisor");
    expect(hrefs).not.toContain("/conhecimento");
  });

  it("não expõe destinos clínicos a admin", () => {
    const hrefs = navItemsForRole("admin").map((item) => item.href);
    expect(hrefs).not.toContain("/sessoes");
    expect(hrefs).not.toContain("/supervisor");
    expect(hrefs).not.toContain("/conhecimento");
  });

  it("expõe Configurações apenas a admin", () => {
    expect(navItemsForRole("admin").map((i) => i.href)).toContain(
      "/configuracoes",
    );
    expect(navItemsForRole("psychologist").map((i) => i.href)).not.toContain(
      "/configuracoes",
    );
    expect(navItemsForRole("secretary").map((i) => i.href)).not.toContain(
      "/configuracoes",
    );
  });
});
