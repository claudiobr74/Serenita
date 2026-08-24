import type { Role } from "./types";

/**
 * Regras de autorização puras.
 *
 * Sem I/O, sem dependência de framework — reutilizadas pela UI e pelo servidor,
 * de modo que a mesma regra tenha uma única definição.
 *
 * Estas funções são a camada 1 e 2 de três (UI -> server -> RLS). Elas NUNCA
 * são o único mecanismo: toda tabela sensível tem policy de RLS equivalente.
 * Ver docs/adr/001-multi-tenancy.md.
 */

/**
 * Acesso a conteúdo clínico — prontuário, plano terapêutico, registros,
 * transcrições, notas de sessão.
 *
 * Ponto crítico e contraintuitivo: `admin` NÃO tem acesso clínico. A RBAC
 * Matrix é explícita — "Cannot access clinical records (HIPAA/LGPD
 * compliance)". É mais restritivo que o padrão da indústria e tem teste de RLS
 * dedicado.
 */
export function canAccessClinicalContent(role: Role): boolean {
  return role === "psychologist";
}

/** Administração da clínica: configurações, usuários, auditoria. */
export function canAdministerClinic(role: Role): boolean {
  return role === "admin";
}

/** Financeiro. `secretary` só visualiza recibos — ver `canManageFinancials`. */
export function canViewFinancials(role: Role): boolean {
  return role === "psychologist" || role === "admin" || role === "secretary";
}

export function canManageFinancials(role: Role): boolean {
  return role === "psychologist" || role === "admin";
}

/** Cadastro de paciente. `secretary` cadastra, mas não vê nada clínico. */
export function canCreatePatient(role: Role): boolean {
  return role === "psychologist" || role === "admin" || role === "secretary";
}

export function canEditAgenda(role: Role): boolean {
  return role === "psychologist" || role === "admin" || role === "secretary";
}
