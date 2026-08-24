"use client";

import { XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect } from "react";

import { cn } from "@/lib/cn";
import { BACKDROP, REDUCED, SHEET, TRANSITIONS } from "@/lib/motion";

/**
 * Sheet — derivado de `01 — FOUNDATIONS / interaction-states`:
 *
 *   "Ao surgir do rodapé (Bottom Sheet), o plano de fundo desfoca
 *    progressivamente no eixo Z de 0px para 16px (Backdrop Blur), conferindo
 *    relevância espacial ao sheet."
 *   transform: translateY(100% → 0%) · backdrop-filter: blur(16px) · 400ms spring
 *
 * `side="bottom"` é o sheet do desenho. `side="right"` é o painel lateral que
 * o mesmo movimento produz em desktop, onde vir de baixo atravessaria a tela
 * inteira.
 *
 * `prefers-reduced-motion` troca o deslocamento por fade de 200ms, conforme
 * `accessibility-reduce-motion`. O `surface-glass` faz o backdrop virar sólido
 * sob `prefers-reduced-transparency` (globals.css).
 *
 * Acessibilidade: `role="dialog"` + `aria-modal`, Escape fecha, e o scroll do
 * body é travado enquanto aberto.
 */

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "bottom" | "right";
  closeLabel?: string;
};

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  side = "bottom",
  closeLabel = "Fechar",
}: SheetProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const panelMotion = reduced
    ? REDUCED
    : side === "bottom"
      ? SHEET
      : {
          initial: { x: "100%" },
          animate: { x: 0 },
          exit: { x: "100%" },
          transition: TRANSITIONS.sheet,
        };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex" data-side={side}>
          <motion.div
            {...BACKDROP}
            onClick={onClose}
            className={cn(
              "surface-glass absolute inset-0 bg-text-primary/30",
              // O desfoque progressivo do eixo Z descrito na spec.
              !reduced && "backdrop-blur-[16px]",
            )}
          />

          <motion.div
            {...panelMotion}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative flex flex-col bg-background-primary shadow-lg",
              side === "bottom"
                ? "mt-auto max-h-[85dvh] w-full rounded-t-2xl"
                : "ml-auto h-full w-full max-w-lg",
            )}
          >
            <div className="flex items-center justify-between gap-4 border-b border-border-default p-6">
              <h2 className="font-display text-h3 font-bold text-text-primary">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-sm",
                  "bg-surface-muted text-text-secondary",
                  "duration-fast transition-colors ease-standard hover:bg-surface-hover",
                )}
              >
                <XIcon size={16} aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-border-default p-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
