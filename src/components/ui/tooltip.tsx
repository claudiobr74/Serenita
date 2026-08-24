"use client";

import { type ReactNode, useId, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Tooltip.
 *
 * Sem component set no Figma — construído por consistência com o sistema.
 * Ver docs/DESIGN_DECISIONS.md #6. Motion: `motion/fast` (150ms), o token que
 * os Motion Tokens designam para "tooltip show".
 *
 * Abre no hover **e no foco por teclado**, e fecha com Escape: um tooltip que
 * só responde ao mouse é inacessível.
 *
 * Nunca use tooltip para informação essencial — em touch ela não aparece. Para
 * conteúdo que o usuário precisa ler, use texto de apoio visível.
 */

export type TooltipProps = {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
};

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>

      <span
        id={id}
        role="tooltip"
        // Fora de tela quando fechado, em vez de removido: o alvo mantém uma
        // referência estável de aria-describedby.
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2",
          "rounded-sm bg-text-primary px-2 py-1",
          "text-caption font-medium whitespace-nowrap text-text-inverse",
          "duration-fast transition-opacity ease-standard",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        {content}
      </span>
    </span>
  );
}
