import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Tag — component set `Tag` (12:249), 4 types.
 *
 * Spec medida: px 8 · py 3 · radius 6 · 11px Medium · letter-spacing 0.3px.
 *
 * Diferente de Badge: Tag classifica por domínio (clínico, financeiro,
 * calendário), Badge comunica status.
 */

type TagVariant = "default" | "clinical" | "financial" | "calendar";

const VARIANT: Record<TagVariant, string> = {
  default: "bg-surface-muted text-text-secondary",
  clinical: "bg-surface-hover text-action-primary",
  financial: "bg-status-warning-bg text-status-warning-text",
  calendar: "bg-status-info-bg text-status-info-text",
};

export type TagProps = ComponentPropsWithoutRef<"span"> & {
  variant?: TagVariant;
};

export function Tag({
  variant = "default",
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-2 py-0.75",
        "text-overline font-medium tracking-[0.3px] whitespace-nowrap",
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
