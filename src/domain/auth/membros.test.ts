import { describe, expect, it } from "vitest";

import { canAccessClinicalContent } from "./policy";
import { DESCRICAO_PAPEL, ORDEM_DOS_PAPEIS } from "./membros";
import { ROLES } from "./types";

describe("descrições de papel", () => {
  it("cobre todos os papéis", () => {
    for (const papel of ROLES) {
      expect(DESCRICAO_PAPEL[papel]).toBeTruthy();
    }
    expect([...ORDEM_DOS_PAPEIS].sort()).toEqual([...ROLES].sort());
  });

  /**
   * O frame 6:5148 descreve o admin com acesso a "prontuários de todos os
   * membros", o que contradiz a RBAC Matrix e o que o banco aplica. Este teste
   * trava a decisão de seguir a matriz: se alguém transcrever a cópia do frame,
   * ele cai.
   */
  it("a descrição do admin não promete acesso clínico", () => {
    const texto = DESCRICAO_PAPEL.admin.toLowerCase();
    expect(canAccessClinicalContent("admin")).toBe(false);
    expect(texto).toContain("não acessa");
    expect(texto).not.toMatch(/acesso irrestrito|todos os prontuários/);
  });

  it("só o psicólogo tem descrição de acesso clínico", () => {
    expect(canAccessClinicalContent("psychologist")).toBe(true);
    expect(DESCRICAO_PAPEL.psychologist.toLowerCase()).toContain("clínico");
    expect(DESCRICAO_PAPEL.secretary.toLowerCase()).toContain(
      "sem acesso clínico",
    );
  });
});
