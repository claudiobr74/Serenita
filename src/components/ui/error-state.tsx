import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * ErrorState — derivado de `error-warning-states` (6:6173, 6:6185).
 *
 * Spec medida:
 *   card   bg background-primary · border border-default · radius 16 · p 24 · gap 16
 *   ícone  círculo 32 radius full bg status-error-bg · ícone 16
 *   título Newsreader Bold 18 text-primary
 *   texto  14 text-secondary
 *   ações  linha, gap 12, Button size="cta"
 *
 * `03 — PATTERNS / Error Handling`: banner inline para falha de submit;
 * página inteira apenas para 500/rede, com botão de retry. Este componente
 * cobre os dois casos — o container decide onde ele aparece.
 */

export type ErrorStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Normalmente um ou dois `<Button size="cta">`. */
  actions?: ReactNode;
  className?: string;
};

export function ErrorState({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-default",
        "bg-background-primary p-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-status-error-bg text-status-error"
        >
          <Icon size={16} strokeWidth={2} />
        </span>
        <p className="font-display text-h3 font-bold text-text-primary">
          {title}
        </p>
      </div>

      <p className="text-body text-text-secondary">{description}</p>

      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
