import { Loader2Icon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Button — component set `Button` (12:147), 36 variants.
 *
 * Spec medida (FIGMA_AUDIT.md §3):
 *   SM  min-h 32 · px 12 · py 6  · radius 6  · 13/18
 *   MD  min-h 40 · px 16 · py 8  · radius 8  · 14/20
 *   LG  min-h 48 · px 24 · py 12 · radius 10 · 16/22
 *   Peso Medium em todos. Disabled = opacity 40%.
 *
 * A API de props vem do design-to-code mapping do Figma (12:637):
 * `<Button variant="primary" size="md">`.
 *
 * `focus-visible` e `loading` não existem como variant no component set, mas
 * são especificados em texto no próprio arquivo — anel 2px em Accessibility, e
 * "Aguarde..." com spin infinito de 1s em `01 — FOUNDATIONS / interaction-states`.
 * Ver docs/DESIGN_DECISIONS.md #4.
 */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "cta";

const VARIANT: Record<Variant, string> = {
  primary: "bg-action-primary text-text-inverse hover:bg-action-primary-hover",
  secondary:
    "bg-action-secondary text-text-primary hover:bg-action-secondary-hover",
  // `outline` não existe no component set. É a ação secundária que as telas de
  // `06 — DESKTOP` usam — "Trabalhar Offline" (6:6183), "Agendar uma consulta"
  // (6:5982): fundo branco com borda. Ver docs/DESIGN_DECISIONS.md #16.
  outline:
    "border border-border-default bg-background-primary text-text-primary hover:bg-surface-hover",
  ghost: "bg-transparent text-action-primary hover:bg-surface-hover",
  danger: "bg-action-danger text-text-inverse hover:bg-action-danger-hover",
};

const SIZE: Record<Size, string> = {
  sm: "min-h-8 gap-1.5 rounded-sm px-3 py-1.5 text-body-sm font-medium",
  md: "min-h-10 gap-2 rounded-md px-4 py-2 text-body font-medium",
  lg: "min-h-12 gap-2 rounded-lg px-6 py-3 text-h4 font-medium",
  // `cta` não existe no component set, mas é o botão de ação que as telas de
  // `06 — DESKTOP` usam de forma consistente — EmptyState (6:5973), ErrorState
  // (6:6180), banner de consentimento (6:6201): px 20 · py 12 · radius 8 ·
  // 14px **SemiBold**. Fica entre MD e LG e não é redutível a nenhum deles.
  // Ver docs/DESIGN_DECISIONS.md #16.
  cta: "min-h-11 gap-2 rounded-md px-5 py-3 text-body font-semibold",
};

const ICON_SIZE: Record<Size, number> = { sm: 14, md: 16, lg: 18, cta: 14 };

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Rótulo exibido enquanto `loading`. O Figma usa "Aguarde...". */
  loadingLabel?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel = "Aguarde...",
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      // Enquanto carrega, leitores de tela precisam saber que a ação está em
      // curso — não basta trocar o texto visível.
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center",
        "duration-fast transition-colors ease-standard",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <Loader2Icon
          size={ICON_SIZE[size]}
          // `animate-spin` do Tailwind é 1s linear infinito, exatamente o que
          // `interaction-states` especifica. `prefers-reduced-motion` é tratado
          // globalmente em globals.css.
          className="animate-spin"
          aria-hidden
        />
      )}
      {loading ? loadingLabel : children}
    </button>
  );
}
