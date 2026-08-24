/**
 * Tipos de paciente.
 *
 * Fonte: frames `lista-pacientes` (6:496) e `novo-paciente` (6:5292).
 */

export const PATIENT_STATUS = ["active", "archived", "discharged"] as const;
export type PatientStatus = (typeof PATIENT_STATUS)[number];

export const CARE_MODALITY = ["in_person", "online"] as const;
export type CareModality = (typeof CARE_MODALITY)[number];

/** Rótulos como no segmented control do frame (6:575–6:581). */
export const ROTULO_STATUS: Record<PatientStatus, string> = {
  active: "Ativos",
  archived: "Arquivados",
  discharged: "Encerrados",
};

/** Singular, para a coluna Status da tabela (6:604). */
export const ROTULO_STATUS_SINGULAR: Record<PatientStatus, string> = {
  active: "Ativo",
  archived: "Arquivado",
  discharged: "Encerrado",
};

/** Rótulos da coluna Modalidade (6:608, 6:631). */
export const ROTULO_MODALIDADE: Record<CareModality, string> = {
  in_person: "Presencial",
  online: "Online",
};

/** Ícone lucide por modalidade, como no frame: casa e globo. */
export const ICONE_MODALIDADE: Record<CareModality, "home" | "globe"> = {
  in_person: "home",
  online: "globe",
};

export type Paciente = {
  readonly id: string;
  readonly displayCode: string;
  readonly fullName: string;
  readonly cpf: string | null;
  readonly status: PatientStatus;
  readonly modality: CareModality | null;
  readonly assignedPsychologistId: string | null;
};

/**
 * O filtro da lista aceita também "todos", que não é um status.
 * Ver o segmented control em 6:573.
 */
export const FILTROS = ["todos", ...PATIENT_STATUS] as const;
export type FiltroDeStatus = (typeof FILTROS)[number];

export function ehFiltroValido(valor: string): valor is FiltroDeStatus {
  return (FILTROS as readonly string[]).includes(valor);
}
