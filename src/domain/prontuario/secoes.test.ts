import { describe, expect, it } from "vitest";

import {
  ABERTA_POR_PADRAO,
  EXEMPLO_SECAO,
  ROTULO_SECAO,
  SECOES_DO_PRONTUARIO,
} from "./secoes";

/**
 * A ordem das seções é a ordem de leitura clínica do frame 6:1658, e o enum do
 * banco (`clinical_record_section`) foi criado na mesma ordem. Se alguém
 * reordenar de um lado só, isto quebra antes de o prontuário ficar embaralhado.
 */
describe("seções do prontuário", () => {
  it("segue a ordem do frame", () => {
    expect([...SECOES_DO_PRONTUARIO]).toEqual([
      "demographic_identification",
      "initial_complaint",
      "clinical_family_history",
      "initial_diagnostic_assessment",
    ]);
  });

  it("tem rótulo e exemplo para cada seção", () => {
    for (const secao of SECOES_DO_PRONTUARIO) {
      expect(ROTULO_SECAO[secao]).toBeTruthy();
      expect(EXEMPLO_SECAO[secao]).toBeTruthy();
    }
  });

  it("usa os rótulos exatos do frame", () => {
    expect(ROTULO_SECAO.demographic_identification).toBe(
      "Identificação Demográfica",
    );
    expect(ROTULO_SECAO.initial_complaint).toBe("Demanda Inicial");
    expect(ROTULO_SECAO.clinical_family_history).toBe(
      "História Clínica e Familiar",
    );
    expect(ROTULO_SECAO.initial_diagnostic_assessment).toBe(
      "Avaliação Diagnóstica Inicial",
    );
  });

  it("abre as duas primeiras, como no frame", () => {
    expect(ABERTA_POR_PADRAO.has("demographic_identification")).toBe(true);
    expect(ABERTA_POR_PADRAO.has("initial_complaint")).toBe(true);
    expect(ABERTA_POR_PADRAO.has("clinical_family_history")).toBe(false);
    expect(ABERTA_POR_PADRAO.has("initial_diagnostic_assessment")).toBe(false);
  });
});
