import { cn } from "@/lib/cn";

import { NavIcon } from "./nav-icon";

export type SyncState = "synced" | "pending" | "syncing" | "error";

/**
 * TopBar — spec medida no frame `TopBar` (6:100) de `06 — DESKTOP`.
 *
 *   h 72 · bg background-primary · border-b border-default · px 32
 *   título: Newsreader Bold 24px text-primary (contextual por rota)
 *   ações (gap 16):
 *     SearchField     w 280 · bg background-secondary · border · radius 8 · px 16 py 8
 *                     ícone 16 · placeholder 14 text-secondary
 *                     KeyShortcut: bg primary · border · radius 4 · px 6 py 2 · mono 10
 *     SyncIndicator   bg surface-hover · radius 8 · px 12 py 8 · dot 6 · 13 Medium
 *     Notification    40x40 · border · radius 8 · ícone 20
 */
export function TopBar({
  title,
  syncState = "synced",
}: {
  title: string;
  syncState?: SyncState;
}) {
  return (
    <header
      className={cn(
        "flex h-topbar shrink-0 items-center justify-between gap-4",
        "border-b border-border-default bg-background-primary px-8",
      )}
    >
      <h1 className="truncate font-display text-h1 font-bold text-text-primary">
        {title}
      </h1>

      <div className="flex shrink-0 items-center gap-4">
        <SearchField />
        <SyncIndicator state={syncState} />
        <button
          type="button"
          aria-label="Notificações"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md border",
            "border-border-default text-text-secondary transition-colors",
            "duration-fast ease-standard hover:bg-surface-hover",
          )}
        >
          <NavIcon name="bell" size={20} />
        </button>
      </div>
    </header>
  );
}

/**
 * Placeholder visual do command palette. A busca funcional (⌘K) é a tela
 * `command-palette-search` (6:6231), implementada na Fase 2.
 */
function SearchField() {
  return (
    <button
      type="button"
      className={cn(
        "hidden w-70 items-center gap-2 rounded-md border border-border-default",
        "bg-background-secondary px-4 py-2 text-left transition-colors",
        "duration-fast ease-standard hover:bg-surface-hover desktop:flex",
      )}
    >
      <NavIcon name="search" size={16} className="shrink-0 text-text-muted" />
      <span className="flex-1 truncate text-body text-text-secondary">
        Buscar paciente ou ação...
      </span>
      <kbd
        className={cn(
          "shrink-0 rounded-xs border border-border-default bg-background-primary",
          "px-1.5 py-0.5 font-mono text-[10px] text-text-muted",
        )}
      >
        ⌘K
      </kbd>
    </button>
  );
}

const SYNC_COPY: Record<SyncState, string> = {
  synced: "Nuvem Sincronizada",
  pending: "Sincronização pendente",
  syncing: "Sincronizando...",
  error: "Falha na sincronização",
};

/**
 * O indicador não depende de cor para transmitir estado — o texto muda junto,
 * conforme a exigência de acessibilidade do Figma para indicadores de status.
 */
function SyncIndicator({ state }: { state: SyncState }) {
  const isError = state === "error";

  return (
    <div
      className={cn(
        "hidden items-center gap-1.5 rounded-md px-3 py-2 desktop:flex",
        isError ? "bg-status-error-bg" : "bg-surface-hover",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          isError ? "bg-status-error" : "bg-status-success",
          state === "syncing" && "animate-pulse",
        )}
      />
      <span
        className={cn(
          "text-body-sm font-medium",
          isError ? "text-status-error" : "text-action-primary",
        )}
      >
        {SYNC_COPY[state]}
      </span>
    </div>
  );
}
