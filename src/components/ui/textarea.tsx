"use client";

import { type ComponentPropsWithoutRef, useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Textarea.
 *
 * Sem component set no Figma — construído por consistência com `Input`
 * (12:168), do qual herda label, borda, radius, cores e tratamento de erro.
 * Ver docs/DESIGN_DECISIONS.md #6.
 *
 * `03 — PATTERNS / Autosave`: onde o campo alimenta prontuário ou plano
 * terapêutico, o container é responsável pelo autosave de 30s com debounce de
 * 500ms — não este componente.
 */

export type TextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  id?: string;
};

export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  disabled,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = `${textareaId}-message`;
  const hasError = Boolean(error);
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", disabled && "opacity-60")}>
      <label
        htmlFor={textareaId}
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

      <textarea
        id={textareaId}
        rows={rows}
        disabled={disabled}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "w-full resize-y rounded-md px-3 py-2.5 text-body",
          "text-text-primary placeholder:text-text-muted",
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
      />

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
