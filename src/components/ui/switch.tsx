"use client";

import { type ComponentPropsWithoutRef, useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Switch.
 *
 * Sem component set, mas com spec de motion em
 * `01 — FOUNDATIONS / interaction-states`: "Interactive Toggle — 150ms
 * spring-back". Ver docs/DESIGN_DECISIONS.md #6.
 *
 * Mesma técnica do Checkbox: o input nativo é o alvo real de foco e clique; o
 * trilho é pintura. Diferença semântica em relação ao Checkbox — o Switch
 * aplica o efeito imediatamente, enquanto o Checkbox só marca uma intenção que
 * será confirmada no submit. Use Switch apenas para o primeiro caso.
 */

export type SwitchProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "id"
> & {
  label: string;
  hint?: string;
  id?: string;
};

export function Switch({
  label,
  hint,
  id,
  className,
  disabled,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-4 py-1",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-body text-text-primary">{label}</span>
        {hint && (
          <span id={hintId} className="text-caption text-text-secondary">
            {hint}
          </span>
        )}
      </span>

      <input
        id={inputId}
        type="checkbox"
        role="switch"
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        className="peer sr-only"
        {...props}
      />

      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full bg-surface-muted",
          "duration-fast transition-colors ease-standard",
          "peer-checked:bg-action-primary",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          "peer-focus-visible:outline-action-primary",
          "after:absolute after:top-0.5 after:left-0.5 after:size-5",
          "after:rounded-full after:bg-background-primary after:shadow-sm",
          "after:duration-spring-subtle after:transition-transform",
          "after:ease-out-expo peer-checked:after:translate-x-5",
        )}
      />
    </label>
  );
}
