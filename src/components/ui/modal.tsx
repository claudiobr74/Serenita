"use client";

import { XIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

/**
 * Modal — component set `Modal` (12:250).
 *
 * Spec medida: w 480 · p 24 · gap 20 · radius 16 · bg background-primary ·
 * shadow-lg. Header 18 SemiBold + close 24 radius 6 bg surface-muted.
 * Separador 1px. Body 14/22 text-secondary. Footer à direita, gap 12.
 *
 * Usa o elemento nativo `<dialog>` em vez de uma biblioteca. Ele entrega, sem
 * dependência, exatamente o que `10 — DEV HANDOFF / Accessibility` exige:
 * focus trap, Escape para fechar, restauração de foco ao fechar,
 * `role="dialog"` e `aria-modal` implícitos.
 *
 * Motion: `motion/standard` (250ms) para abrir/fechar, conforme os Motion
 * Tokens. `prefers-reduced-motion` é tratado globalmente.
 */

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Rótulo acessível do botão de fechar. */
  closeLabel?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel = "Fechar",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    // Escape fecha o <dialog> nativamente; `cancel` e `close` mantêm o estado
    // do React em sincronia com o que o browser fez.
    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      onClick={(event) => {
        // Clique no backdrop fecha. O <dialog> reporta o próprio elemento como
        // target quando o clique cai fora do conteúdo.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-full max-w-[480px] rounded-2xl bg-background-primary p-6",
        "text-text-primary shadow-lg backdrop:bg-text-primary/40",
        "open:flex open:flex-col open:gap-5",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="modal-title"
          className="text-h3 font-semibold text-text-primary"
        >
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-sm",
            "bg-surface-muted text-text-secondary",
            "duration-fast transition-colors ease-standard hover:bg-surface-hover",
          )}
        >
          <XIcon size={14} aria-hidden />
        </button>
      </div>

      <hr className="border-border-default" />

      <div className="text-body text-text-secondary">{children}</div>

      {footer && (
        // `03 — PATTERNS / Actions`: primária à direita, secundária à esquerda dela.
        <div className="flex items-center justify-end gap-3">{footer}</div>
      )}
    </dialog>
  );
}
