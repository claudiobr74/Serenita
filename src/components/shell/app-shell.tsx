import type { Clinic, Profile } from "@/domain/auth/types";

import { Sidebar } from "./sidebar";
import { type SyncState, TopBar } from "./topbar";

/**
 * AppShell — chrome compartilhado das 25 telas de `06 — DESKTOP` que o possuem.
 *
 * Sidebar fixa à esquerda; TopBar de 72px; área de conteúdo em
 * background-secondary com padding 32.
 *
 * O Modo Sessão (`/sessao/[id]`) é full-screen e NÃO usa este shell — nas telas
 * `ipad-modo-sessao`, `ipad-preparar-sessao` e `ipad-pos-sessao` o rail está
 * ausente. Essas rotas ficam num route group próprio.
 */
export function AppShell({
  profile,
  clinic,
  title,
  syncState,
  children,
}: {
  profile: Profile;
  clinic: Clinic;
  title: string;
  syncState?: SyncState;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background-secondary">
      <div className="shrink-0">
        <Sidebar profile={profile} clinic={clinic} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} syncState={syncState} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
