import type { Role } from "./types";

/**
 * Rótulos e descrições dos papéis, para a tela de Usuários e Permissões.
 *
 * ATENÇÃO — divergência deliberada do frame.
 *
 * O card "Níveis de Acesso (RBAC)" do frame 6:4989 descreve o Administrador
 * como tendo "acesso irrestrito a ... prontuários de todos os membros"
 * (6:5148). Isso contradiz frontalmente a RBAC Matrix de
 * `04 — INFORMATION ARCHITECTURE`, que diz "**Não acessa registros clínicos**
 * (compliance HIPAA/LGPD)" — e contradiz o que o banco de fato faz:
 * `is_clinical_role()` devolve `false` para admin, com teste de RLS dedicado.
 *
 * Seguimos a RBAC Matrix. Exibir a cópia do card seria afirmar ao usuário uma
 * propriedade de conformidade que é falsa no sistema.
 * Ver docs/DESIGN_DECISIONS.md #23.
 */

export const ROTULO_PAPEL: Record<Role, string> = {
  admin: "Administrador",
  psychologist: "Psicólogo",
  secretary: "Secretária",
};

export const DESCRICAO_PAPEL: Record<Role, string> = {
  admin:
    "Configurações da clínica, usuários, faturamento global e auditoria. Não acessa prontuários nem registros clínicos.",
  psychologist:
    "Acesso clínico aos próprios pacientes: prontuário, plano terapêutico, sessões e agenda. Não vê pacientes de outros profissionais.",
  secretary:
    "Agenda, status de consultas e dados cadastrais de pacientes. Sem acesso clínico.",
};

/** Ordem de exibição no card, igual à do frame (6:5146, 6:5149, 6:5152). */
export const ORDEM_DOS_PAPEIS: readonly Role[] = [
  "admin",
  "psychologist",
  "secretary",
];

export type StatusMembro = "ativo" | "arquivado" | "convite_pendente";

export const ROTULO_STATUS: Record<StatusMembro, string> = {
  ativo: "Ativo",
  arquivado: "Arquivado",
  convite_pendente: "Pendente",
};
