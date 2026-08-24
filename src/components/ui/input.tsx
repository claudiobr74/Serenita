"use client";

import { type ComponentPropsWithoutRef, useId } from "react";

import { cn } from "@/lib/cn";

/**
 * Input — component set `Input` (12:168), 4 states.
 *
 * Spec medida (FIGMA_AUDIT.md §3):
 *   wrapper gap 6 · label 13 Medium text-primary
 *   box h 40 · px 12 · py 10 · radius 8 · bg background-primary
 *   default  border 1px border-default
 *   focused  border 2px action-primary
 *   error    border 1px action-danger + mensagem 12 action-danger
 *   disabled border 1px border-default + bg surface-muted + opacity 60%
 *   placeholder 14 text-muted
 *
 * `03 — PATTERNS / Validation`: validação inline no blur; erro mostra borda e
 * mensagem abaixo; **sucesso é silencioso** — sem bordas verdes.
 *
 * Acessibilidade (`10 — DEV HANDOFF`): input ligado ao label por htmlFor/id;
 * a mensagem de erro é anunciada via aria-describedby + role="alert".
 */

export type InputProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  label: string;
  /** Presente = estado de erro. Ausente = neutro. Sucesso não tem estado visual. */
  error?: string;
  /** Texto de apoio abaixo do campo, quando não há erro. */
  hint?: string;
  id?: string;
};

export function Input({
  label,
  error,
  hint,
  id,
  className,
  disabled,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const hasError = Boolean(error);
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", disabled && "opacity-60")}>
      <label
        htmlFor={inputId}
        className={cn(
          "text-body-sm font-medium",
          disabled ? "text-text-muted" : "text-text-primary",
        )}
      >
        {label}
        {required && (
          // `03 — PATTERNS`: campos obrigatórios com asterisco sutil.
          <span className="ml-0.5 text-text-secondary" aria-hidden>
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        disabled={disabled}
        required={required}
        aria-invalid={hasError || undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(
          "h-10 w-full rounded-md px-3 py-2.5 text-body",
          "text-text-primary placeholder:text-text-muted",
          "duration-fast transition-colors ease-standard",
          // O anel global de foco já cobre :focus-visible; a borda de 2px do
          // estado Focused é aplicada aqui para bater com o frame.
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
