import { requireViewer } from "@/server/auth/session";

import { SECOES, secoesVisiveisPara } from "./secoes";
import { SecaoAtiva } from "./secao-ativa";

/**
 * Shell de Configurações — sub-navegação lateral do frame 6:5078.
 *
 * Spec medida: card 260px · p 16 · gap 4 · radius 16 · bg background-primary
 * item px 12 · py 10 · radius 8 · 14 Medium text-secondary
 * ativo: bg surface-hover · SemiBold action-primary
 *
 * **Sem guard de papel aqui.** O Route Map lista `/configuracoes` como Admin,
 * mas lista `/configuracoes/calendario` como Psychologist — ou seja, o shell é
 * compartilhado e o papel é por seção, não pela raiz. Guardar tudo como Admin
 * barraria o psicólogo da própria configuração de calendário na Fase 5, e do
 * próprio perfil agora. Ver docs/DESIGN_DECISIONS.md #33.
 *
 * Cada página guarda a si mesma; aqui só filtramos o que aparece na navegação.
 */
export default async function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireViewer();
  const visiveis = secoesVisiveisPara(profile.role);

  return (
    <div className="flex flex-col gap-6 desktop:flex-row">
      <nav
        aria-label="Seções de configurações"
        className="h-fit w-full shrink-0 rounded-2xl border border-border-default bg-background-primary p-4 desktop:w-[260px]"
      >
        <ul className="flex flex-col gap-1">
          {visiveis.map((secao) => (
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

export { SECOES };
