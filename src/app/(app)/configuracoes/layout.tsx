import { redirect } from "next/navigation";

import { requireViewer } from "@/server/auth/session";

import { SecaoAtiva } from "./secao-ativa";

/**
 * Shell de Configurações — sub-navegação lateral do frame 6:5078.
 *
 * Spec medida: card 260px · p 16 · gap 4 · radius 16 · bg background-primary
 * item px 12 · py 10 · radius 8 · 14 Medium text-secondary
 * ativo: bg surface-hover · SemiBold action-primary
 *
 * As 8 seções são as do frame. Só "Usuários e Acessos" existe nesta fase; as
 * demais chegam com as fases que as implementam e por isso aparecem
 * desabilitadas, e não como links quebrados.
 * Ver docs/DESIGN_DECISIONS.md #28.
 */

export type SecaoConfig = {
  readonly rotulo: string;
  readonly href?: string;
  readonly fase?: string;
};

export const SECOES: readonly SecaoConfig[] = [
  { rotulo: "Perfil profissional", fase: "Fase 3, fatia seguinte" },
  { rotulo: "Dados da Clínica", href: "/onboarding" },
  { rotulo: "Profissionais", fase: "Fase 4" },
  { rotulo: "Usuários e Acessos", href: "/configuracoes/usuarios" },
  { rotulo: "Google Calendar", fase: "Fase 5" },
  { rotulo: "Faturamento", fase: "Fase 10" },
  { rotulo: "Modelos de Prontuário", fase: "Fase 6" },
  { rotulo: "Segurança e Auditoria", fase: "Fase 10" },
];

export default async function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `/configuracoes` inteiro é rota Admin no Route Map.
  const viewer = await requireViewer();
  if (viewer.profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6 desktop:flex-row">
      <nav
        aria-label="Seções de configurações"
        className="h-fit w-full shrink-0 rounded-2xl border border-border-default bg-background-primary p-4 desktop:w-[260px]"
      >
        <ul className="flex flex-col gap-1">
          {SECOES.map((secao) => (
            <li key={secao.rotulo}>
              {secao.href ? (
                <SecaoAtiva href={secao.href} rotulo={secao.rotulo} />
              ) : (
                <span
                  aria-disabled
                  title={`Chega na ${secao.fase}.`}
                  className="block cursor-not-allowed rounded-md px-3 py-2.5 text-body font-medium text-text-muted"
                >
                  {secao.rotulo}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
    </div>
  );
}
