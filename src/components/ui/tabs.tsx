"use client";

import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/cn";

/**
 * Tabs.
 *
 * Sem component set no Figma, mas desenhado dentro de `perfil-paciente`
 * (6:783), onde o perfil do paciente tem as abas Overview, Prontuário, Plano,
 * Timeline e Documentos. Ver docs/DESIGN_DECISIONS.md #6.
 *
 * Duas formas, porque o produto precisa das duas:
 *
 * - `TabLinks` — abas que são rotas de verdade. É o caso do perfil do paciente,
 *   cujo Route Map define `/pacientes/[id]/prontuario`, `/plano`, `/timeline`.
 *   Navegação real: o link é compartilhável e o botão voltar funciona.
 *
 * - `Tabs` — abas de estado local, para quando não há rota correspondente.
 *   Implementa o padrão ARIA completo, incluindo navegação por setas exigida
 *   em `10 — DEV HANDOFF / Accessibility`.
 */

const TAB_BASE = cn(
  "relative -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-1 pb-3",
  "duration-fast text-body transition-colors ease-standard",
);

const TAB_ACTIVE = "border-action-primary font-semibold text-action-primary";
const TAB_IDLE = cn(
  "border-transparent font-medium text-text-secondary",
  "hover:border-border-default hover:text-text-primary",
);

export type TabLinkItem = {
  readonly label: string;
  readonly href: Route;
};

export function TabLinks({
  items,
  currentPath,
  label = "Seções",
  className,
}: {
  items: readonly TabLinkItem[];
  currentPath: string;
  label?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "flex gap-6 overflow-x-auto border-b border-border-default",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = currentPath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(TAB_BASE, isActive ? TAB_ACTIVE : TAB_IDLE)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export type TabItem = {
  readonly id: string;
  readonly label: string;
};

export function Tabs({
  items,
  value,
  onChange,
  label = "Seções",
  className,
}: {
  items: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}) {
  // Setas navegam entre abas, com wrap-around — padrão ARIA e exigência de
  // `10 — DEV HANDOFF / Accessibility`.
  function handleKeyDown(event: React.KeyboardEvent) {
    const currentIndex = items.findIndex((item) => item.id === value);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      onChange(items[nextIndex]!.id);
    }
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex gap-6 overflow-x-auto border-b border-border-default",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.id}`}
            // Só a aba ativa entra na ordem de Tab; as demais são alcançadas
            // por seta, conforme o padrão ARIA.
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(TAB_BASE, isActive ? TAB_ACTIVE : TAB_IDLE)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
  className,
}: {
  id: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!active) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
}
