/**
 * Papéis do Serenità.
 *
 * Fonte: RBAC Matrix do Figma (`04 — INFORMATION ARCHITECTURE`, 12:585).
 * Espelha o enum `profile_role` no Postgres.
 */
export const ROLES = ["psychologist", "admin", "secretary"] as const;

export type Role = (typeof ROLES)[number];

export type Profile = {
  readonly id: string;
  readonly clinicId: string;
  readonly fullName: string;
  readonly role: Role;
  readonly avatarUrl: string | null;
  /** Registro no Conselho Regional de Psicologia. Só para `psychologist`. */
  readonly crp: string | null;
};

export type Clinic = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly logoUrl: string | null;
};
