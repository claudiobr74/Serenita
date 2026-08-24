"use client";

import { CheckIcon } from "lucide-react";
import { type ComponentPropsWithoutRef, useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Checkbox.
 *
 * Sem component set, mas com spec de motion em
 * `01 — FOUNDATIONS / interaction-states`: "Elastic pop: scale(0.6) → scale(1.0)".
 * Ver docs/DESIGN_DECISIONS.md #6.
 *
 * O input nativo fica visualmente oculto mas continua sendo o alvo de foco e
 * de clique — o quadrado é apenas pintura. Assim teclado, formulário e
 * leitores de tela funcionam sem nenhum ARIA extra.
 *
 * O `label` envolve tudo, o que dá o alvo de toque de 44pt exigido para iPad
 * sem inflar o quadrado de 18px do desenho.
 */

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "id"
> & {
  label: string;
  /** Texto de apoio abaixo do rótulo. */
  hint?: string;
  id?: string;
};

export function Checkbox({
  label,
  hint,
  id,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group flex min-h-11 cursor-pointer items-start gap-3 py-1",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        disabled={disabled}
        aria-describedby={hint ? hintId : undefined}
        className="peer sr-only"
        {...props}
      />

      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-xs border",
          "border-border-default bg-background-primary text-text-inverse",
          "duration-fast transition-all ease-standard",
          "peer-checked:border-action-primary peer-checked:bg-action-primary",
          // Anel de foco replicado do global, já que o input real está oculto.
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          "peer-focus-visible:outline-action-primary",
        )}
      >
        <CheckIcon
          size={12}
          strokeWidth={3}
          className={cn(
            "scale-60 opacity-0 transition-transform",
            "duration-spring-subtle ease-out-expo",
            "peer-checked:group-has-checked:scale-100 peer-checked:group-has-checked:opacity-100",
            "group-has-checked:scale-100 group-has-checked:opacity-100",
          )}
        />
      </span>

      <span className="flex flex-col gap-0.5">
        <span className="text-body text-text-primary">{label}</span>
        {hint && (
          <span id={hintId} className="text-caption text-text-secondary">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}
