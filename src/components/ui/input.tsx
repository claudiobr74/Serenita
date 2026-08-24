"use client";

import { type ComponentPropsWithoutRef, type ReactNode, useId } from "react";

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
  /**
   * Conteúdo ancorado à direita, dentro da caixa do campo.
   *
   * Derivado da instância desenhada no login (`6:27`), onde o campo de senha
   * traz o olho de revelar em 16px. Ver docs/DESIGN_DECISIONS.md #6.
   */
  trailing?: ReactNode;
  /** Ação à direita do label — "Esqueci minha senha" no login (`6:26`). */
  labelAction?: ReactNode;
};

export function Input({
  label,
  error,
  hint,
  id,
  className,
  disabled,
  required,
  trailing,
  labelAction,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const hasError = Boolean(error);
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-1.5", disabled && "opacity-60")}>
      <div className="flex items-baseline justify-between gap-4">
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
        {labelAction}
      </div>

      <div className="relative flex w-full items-center">
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
            // Espaço para o conteúdo à direita não ficar por cima do texto.
            trailing && "pr-10",
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute right-3 flex items-center">{trailing}</span>
        )}
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
