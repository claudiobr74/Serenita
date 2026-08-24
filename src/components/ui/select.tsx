"use client";

import { ChevronDownIcon } from "lucide-react";
import { type ComponentPropsWithoutRef, useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Select.
 *
 * Sem component set no Figma — construído por consistência com `Input`
 * (12:168). Ver docs/DESIGN_DECISIONS.md #6.
 *
 * Usa `<select>` nativo em vez de um combobox customizado: navegação por
 * teclado, busca por digitação e o picker nativo do iPad vêm de graça, e o
 * alvo de toque de 44pt exigido para tablet é atendido pelo próprio sistema.
 * Um combobox só se justifica quando houver requisito de busca ou multi-seleção
 * — aí entra `MultiSelect`, na fase que precisar dele.
 */

export type SelectOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
};

export type SelectProps = Omit<
  ComponentPropsWithoutRef<"select">,
  "id" | "children"
> & {
  label: string;
  options: readonly SelectOption[];
  /** Opção vazia inicial. Ausente = o primeiro item já vem selecionado. */
  placeholder?: string;
  error?: string;
  hint?: string;
  id?: string;
};

export function Select({
  label,
  options,
  placeholder,
  error,
  hint,
  id,
  className,
  disabled,
  required,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;
  const hasError = Boolean(error);
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", disabled && "opacity-60")}>
      <label
        htmlFor={selectId}
        className={cn(
          "text-body-sm font-medium",
          disabled ? "text-text-muted" : "text-text-primary",
        )}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-text-secondary" aria-hidden>
            *
          </span>
        )}
      </label>

      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            "h-10 w-full appearance-none rounded-md py-2.5 pr-10 pl-3",
            "text-body text-text-primary",
            "duration-fast transition-colors ease-standard",
            "focus:border-2 focus:outline-none",
            disabled
              ? "border border-border-default bg-surface-muted"
              : "bg-background-primary",
            hasError
              ? "border border-action-danger focus:border-action-danger"
              : "border border-border-default focus:border-action-primary",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDownIcon
          size={16}
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
        />
      </div>

      {message && (
        <p
          id={messageId}
          role={hasError ? "alert" : undefined}
          className={cn(
            "text-caption",
            hasError ? "text-status-error-text" : "text-text-secondary",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
