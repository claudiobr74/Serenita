import { ConsentimentoCookies } from "@/components/lgpd/consentimento-cookies";
import { AppShell } from "@/components/shell/app-shell";
import { requireViewer } from "@/server/auth/session";

/**
 * Layout da área autenticada.
 *
 * Os placeholders da Fase 1 saíram: perfil e clínica vêm do banco, sob RLS, na
 * identidade do usuário da sessão.
 *
 * `requireViewer()` é a checagem REAL de acesso — o redirect do `proxy.ts` é
 * apenas otimista e não prova que existe perfil ativo. Um usuário autenticado
 * sem perfil (convite pendente, perfil arquivado) cai aqui e volta ao login.
 *
 * Como todo Server Component filho pode chamar `getViewer()` de novo sem custo
 * — `cache()` memoiza por render pass — o layout não precisa repassar o viewer
 * por props além do que o shell consome.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, clinic } = await requireViewer();

  return (
    <>
      <AppShell profile={profile} clinic={clinic} title="Hoje no Serenitá">
        {children}
      </AppShell>
      <ConsentimentoCookies />
    </>
  );
}
