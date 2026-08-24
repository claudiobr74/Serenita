import { describe, expect, it } from "vitest";

import {
  canAccessClinicalContent,
  canAdministerClinic,
  canManageFinancials,
} from "./policy";

/**
 * Estas asserções codificam a RBAC Matrix do Figma (12:585). Elas existem para
 * que uma "simplificação" futura da autorização quebre o build em vez de
 * silenciosamente abrir acesso a prontuário.
 */
describe("acesso a conteúdo clínico", () => {
  it("permite psychologist", () => {
    expect(canAccessClinicalContent("psychologist")).toBe(true);
  });

  // O caso mais importante e mais contraintuitivo do sistema.
  it("NEGA admin — exigência de compliance HIPAA/LGPD", () => {
    expect(canAccessClinicalContent("admin")).toBe(false);
  });

  it("nega secretary", () => {
    expect(canAccessClinicalContent("secretary")).toBe(false);
  });
});

describe("administração da clínica", () => {
  it("permite apenas admin", () => {
    expect(canAdministerClinic("admin")).toBe(true);
    expect(canAdministerClinic("psychologist")).toBe(false);
    expect(canAdministerClinic("secretary")).toBe(false);
  });
});

describe("gestão financeira", () => {
  it("exclui secretary, que apenas visualiza recibos", () => {
    expect(canManageFinancials("psychologist")).toBe(true);
    expect(canManageFinancials("admin")).toBe(true);
    expect(canManageFinancials("secretary")).toBe(false);
  });
});
