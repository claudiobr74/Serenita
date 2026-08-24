import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Card — component set `Card` (12:196), 3 variants.
 *
 * Spec medida: bg background-primary · p 20 · gap 12 · radius 12.
 *   default   border 1px border-default
 *   outlined  idêntico a default no arquivo — ver docs/DESIGN_DECISIONS.md #5
 *   elevated  shadow-sm, sem borda
 *
 * `outlined` é mantido na API porque o design-to-code mapping do Figma
 * referencia `<Card variant="outlined">` explicitamente.
 */

type CardVariant = "default" | "elevated" | "outlined";

const VARIANT: Record<CardVariant, string> = {
  default: "border border-border-default",
  outlined: "border border-border-default",
  elevated: "shadow-sm",
};

export type CardProps = ComponentPropsWithoutRef<"div"> & {
  variant?: CardVariant;
};

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-background-primary p-5",
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn("text-h4 font-semibold text-text-primary", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p className={cn("text-body text-text-secondary", className)} {...props}>
      {children}
    </p>
  );
}
