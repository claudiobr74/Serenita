import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * AlertBanner — derivado do banner de consentimento em `error-warning-states`
 * (6:6195).
 *
 * Spec medida:
 *   bg status-warning-bg · border 1px status-warning · radius 12 · p 20 · gap 16
 *   ícone  círculo 40 radius full bg background-primary · ícone 20
 *   título Newsreader Bold 16 text-primary
 *   texto  13 text-secondary
 *   ação   à direita, Button size="cta"
 *
 * Uso central no produto: bloqueio de funcionalidades de IA pendentes de
 * consentimento do paciente (Fase 7) e reconexão do Google Calendar (Fase 5).
 *
 * O banner nunca é o mecanismo de bloqueio — apenas o comunica. O bloqueio
 * real é server-side. Ver docs/adr/003-ai-provider-abstraction.md.
 */

type BannerTone = "warning" | "info" | "error";

const TONE: Record<BannerTone, string> = {
  warning: "border-status-warning bg-status-warning-bg",
  info: "border-status-info bg-status-info-bg",
  error: "border-action-danger bg-status-error-bg",
};

const ICON_TONE: Record<BannerTone, string> = {
  warning: "text-status-warning-text",
  info: "text-status-info",
  error: "text-status-error",
};

export type AlertBannerProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: BannerTone;
  /** Normalmente um `<Button size="cta">`. */
  action?: ReactNode;
  className?: string;
};

export function AlertBanner({
  icon: Icon,
  title,
  description,
  tone = "warning",
  action,
  className,
}: AlertBannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-5",
        "tablet:flex-row tablet:items-center",
        TONE[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-full bg-background-primary",
          ICON_TONE[tone],
        )}
      >
        <Icon size={20} strokeWidth={2} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-display text-h4 font-bold text-text-primary">
          {title}
        </p>
        <p className="text-body-sm text-text-secondary">{description}</p>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
