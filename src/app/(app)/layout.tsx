import { AppShell } from "@/components/shell/app-shell";
import type { Clinic, Profile } from "@/domain/auth/types";

/**
 * Layout da área autenticada.
 *
 * FASE 1: perfil e clínica são placeholders para que o shell possa ser
 * comparado visualmente com o Figma. A autenticação real (Supabase Auth +
 * carregamento do perfil + guard de rota) chega na Fase 3, e substitui estas
 * constantes por `getCurrentProfile()`.
 *
 * Não é dado clínico e não é dado real — apenas o chrome do shell.
 * Ver IMPLEMENTATION_PLAN.md, Fase 3.
 */
const PLACEHOLDER_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000000",
  clinicId: "00000000-0000-0000-0000-000000000000",
  fullName: "Dra. Mariana Costa",
  role: "psychologist",
  avatarUrl: null,
  crp: null,
};

const PLACEHOLDER_CLINIC: Clinic = {
  id: "00000000-0000-0000-0000-000000000000",
  name: "Serenitá",
  slug: "serenita",
  logoUrl: null,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      profile={PLACEHOLDER_PROFILE}
      clinic={PLACEHOLDER_CLINIC}
      title="Hoje no Serenitá"
    >
      {children}
    </AppShell>
  );
}
