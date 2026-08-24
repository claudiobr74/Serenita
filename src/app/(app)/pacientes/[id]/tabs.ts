import type { Route } from "next";

import {
  canAccessClinicalContent,
  canAdministerClinic,
  canViewFinancials,
} from "@/domain/auth/policy";
import type { Role } from "@/domain/auth/types";

/**
 * Tabs do perfil do paciente — frame `ProfileTabs` (6:869).
 *
 * O frame traz **sete** tabs; o IMPLEMENTATION_PLAN previa cinco, e chamava de
 * "Timeline" o que o frame chama de "Sessões". Seguimos o frame.
 * Ver docs/DESIGN_DECISIONS.md #41.
 *
 * Cada tab declara quem a enxerga. Como em `nav-items.ts` e nas seções de
 * Configurações, isto é **conveniência de navegação**: o bloqueio real é o
 * guard de cada página e a RLS.
 */

export type TabDoPaciente = {
  readonly rotulo: string;
  /** Sufixo da rota. Vazio = a própria `/pacientes/[id]`. */
  readonly segmento: string;
  readonly visivelPara: (papel: Role) => boolean;
};

const todos = () => true;

export const TABS: readonly TabDoPaciente[] = [
  { rotulo: "Resumo", segmento: "", visivelPara: todos },
  {
    rotulo: "Prontuário",
    segmento: "/prontuario",
    visivelPara: canAccessClinicalContent,
  },
  {
    rotulo: "Plano Terapêutico",
    segmento: "/plano",
    visivelPara: canAccessClinicalContent,
  },
  {
    rotulo: "Sessões",
    segmento: "/sessoes",
    visivelPara: canAccessClinicalContent,
  },
  {
    rotulo: "Documentos",
    segmento: "/documentos",
    visivelPara: (papel) =>
      papel === "psychologist" || canAdministerClinic(papel),
  },
  {
    rotulo: "Financeiro",
    segmento: "/financeiro",
    visivelPara: canViewFinancials,
  },
  {
    rotulo: "Consentimentos",
    segmento: "/consentimentos",
    visivelPara: (papel) =>
      papel === "psychologist" || canAdministerClinic(papel),
  },
];

export function tabsVisiveisPara(papel: Role, pacienteId: string) {
  return TABS.filter((tab) => tab.visivelPara(papel)).map((tab) => ({
    label: tab.rotulo,
    href: `/pacientes/${pacienteId}${tab.segmento}` as Route,
  }));
}
