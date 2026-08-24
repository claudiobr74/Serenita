/**
 * Tipos da clínica.
 *
 * Fonte: frame `onboarding-clinica` (6:5213) e o data model do Dev Handoff.
 */

export const CLINIC_KINDS = ["individual", "multi_professional"] as const;

export type ClinicKind = (typeof CLINIC_KINDS)[number];

/** Rótulos exatamente como nos frames 6:5252 e 6:5254. */
export const ROTULO_TIPO: Record<ClinicKind, string> = {
  individual: "Consultório Individual",
  multi_professional: "Clínica Multi-profissional",
};

/**
 * O StepCounter (6:5225) diz "PASSO 1 DE 9", mas apenas o passo 1 está
 * desenhado. Ver docs/DESIGN_DECISIONS.md #25.
 */
export const TOTAL_DE_PASSOS = 9;
