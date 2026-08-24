import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Badge — component set `Badge` (12:179), 5 types.
 *
 * Spec medida: px 10 · py 4 · radius full · 12px Medium.
 *
 * Note `warning`: o texto usa `status-warning-text` (#846447), mais escuro que
 * `status-warning` (#D6A374). É assim no Figma — o tom claro não atingiria
 * contraste AA sobre `status-warning-bg`.
 */

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const VARIANT: Record<BadgeVariant, string> = {
  success: "bg-status-success-bg text-status-success-text",
  warning: "bg-status-warning-bg text-status-warning-text",
  error: "bg-status-error-bg text-status-error-text",
  info: "bg-status-info-bg text-status-info-text",
  neutral: "bg-surface-muted text-text-secondary",
};

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  variant?: BadgeVariant;
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-1",
        "text-caption font-medium whitespace-nowrap",
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
