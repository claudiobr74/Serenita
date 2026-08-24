import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * EmptyState — derivado de `empty-states` (6:5957), 4 variações no frame.
 *
 * Spec medida (6:5967):
 *   card    bg background-primary · border border-default · radius 20 · p 40
 *           gap 24 · shadow-card · centralizado
 *   ícone   círculo 80 radius full bg background-secondary · ícone 32
 *   título  Newsreader Bold 22 text-primary
 *   texto   14 text-secondary centralizado · largura 320
 *   ação    Button size="cta"
 *
 * `03 — PATTERNS / Empty States`: ilustração + título + descrição + CTA.
 *
 * `tone="positive"` é a quarta variação do frame ("Tudo em dia!", 6:5994): o
 * círculo usa `surface-hover` em vez de `background-secondary`, sinalizando
 * que o vazio é um bom resultado, não uma lacuna a preencher.
 */

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Normalmente um `<Button size="cta">`. */
  action?: ReactNode;
  tone?: "neutral" | "positive";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 rounded-3xl",
        "border border-border-default bg-background-primary p-10 shadow-card",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-20 shrink-0 place-items-center rounded-full",
          tone === "positive"
            ? "bg-surface-hover text-action-primary"
            : "bg-background-secondary text-text-secondary",
        )}
      >
        <Icon size={32} strokeWidth={1.5} />
      </span>

      <div className="flex flex-col items-center gap-2">
        <p className="text-center font-display text-[22px] font-bold text-text-primary">
          {title}
        </p>
        <p className="w-80 max-w-full text-center text-body text-text-secondary">
          {description}
        </p>
      </div>

      {action}
    </div>
  );
}
