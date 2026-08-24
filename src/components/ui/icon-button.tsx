import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

/**
 * IconButton — derivado do NotificationButton do TopBar (6:112).
 *
 * Spec medida: 40×40 · border 1px border-default · radius 8 · ícone 20.
 *
 * `label` é obrigatório e vira `aria-label` — um botão só com ícone é invisível
 * para leitores de tela sem ele. Também alimenta o `title`, que dá a dica em
 * hover.
 *
 * Tamanhos menores que `md` ficam abaixo dos 44pt exigidos para iPad, então
 * `sm` só deve aparecer em contexto desktop ou dentro de uma área de toque
 * maior (como o botão de fechar dentro de um Toast).
 */

type IconButtonVariant = "outline" | "ghost";
type IconButtonSize = "sm" | "md";

const VARIANT: Record<IconButtonVariant, string> = {
  outline:
    "border border-border-default bg-background-primary text-text-secondary hover:bg-surface-hover",
  ghost: "text-text-secondary hover:bg-surface-hover",
};

const SIZE: Record<IconButtonSize, string> = {
  sm: "size-8 rounded-sm",
  md: "size-10 rounded-md",
};

const ICON_SIZE: Record<IconButtonSize, number> = { sm: 16, md: 20 };

export type IconButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children"
> & {
  icon: LucideIcon;
  /** Rótulo acessível. Obrigatório. */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
};

export function IconButton({
  icon: Icon,
  label,
  variant = "outline",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid shrink-0 place-items-center",
        "duration-fast transition-colors ease-standard",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    >
      <Icon size={ICON_SIZE[size]} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
