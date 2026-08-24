import { canAdministerClinic } from "@/domain/auth/policy";
import type { Role } from "@/domain/auth/types";

/**
 * Seções de Configurações — as oito do frame 6:5078.
 *
 * Cada uma declara quem a enxerga. Isto é **conveniência de navegação**, não
 * mecanismo de segurança: o bloqueio real está no guard de cada página e na
 * RLS. Mesma postura de `components/shell/nav-items.ts`.
 *
 * As não implementadas aparecem desabilitadas, com a fase em que chegam, em
 * vez de sumirem ou virarem link quebrado. Ver docs/DESIGN_DECISIONS.md #28.
 */

export type SecaoConfig = {
  readonly rotulo: string;
  readonly href?: string;
  readonly fase?: string;
  /** Quem enxerga a seção. Ausente = todos. */
  readonly visivelPara?: (papel: Role) => boolean;
};

const todos = () => true;

export const SECOES: readonly SecaoConfig[] = [
  {
    rotulo: "Perfil profissional",
    href: "/configuracoes/perfil",
    visivelPara: todos,
  },
  {
    rotulo: "Dados da Clínica",
    href: "/onboarding",
    visivelPara: canAdministerClinic,
  },
  { rotulo: "Profissionais", fase: "Fase 4", visivelPara: canAdministerClinic },
  {
    rotulo: "Usuários e Acessos",
    href: "/configuracoes/usuarios",
    visivelPara: canAdministerClinic,
  },
  // Route Map: `/configuracoes/calendario` é **Psychologist**, não Admin.
  {
    rotulo: "Google Calendar",
    fase: "Fase 5",
    visivelPara: (papel) => papel === "psychologist",
  },
  { rotulo: "Faturamento", fase: "Fase 10", visivelPara: canAdministerClinic },
  {
    rotulo: "Modelos de Prontuário",
    fase: "Fase 6",
    visivelPara: (papel) => papel === "psychologist",
  },
  {
    rotulo: "Segurança e Auditoria",
    fase: "Fase 10",
    visivelPara: canAdministerClinic,
  },
];

export function secoesVisiveisPara(papel: Role): readonly SecaoConfig[] {
  return SECOES.filter((secao) => (secao.visivelPara ?? todos)(papel));
}
