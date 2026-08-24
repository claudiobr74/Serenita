import type { Route } from "next";

import {
  canAccessClinicalContent,
  canAdministerClinic,
  canViewFinancials,
} from "@/domain/auth/policy";
import type { Role } from "@/domain/auth/types";

/**
 * Navegação da sidebar.
 *
 * Os 11 itens e sua ordem são medidos no frame `Sidebar` (6:41), idêntico nas
 * 25 telas de `06 — DESKTOP` que possuem shell.
 *
 * Vive em `components/` e não em `domain/` porque é configuração de
 * apresentação. A visibilidade NÃO reimplementa a RBAC: cada item declara qual
 * predicado de `domain/auth/policy` o governa, de modo que autorização tenha
 * uma única definição.
 *
 * Itens fora do escopo do papel não são renderizados — não são desabilitados —
 * para não revelar a existência de recursos. Ver docs/DESIGN_DECISIONS.md #7.
 * Isto é conveniência de navegação, nunca mecanismo de segurança: o bloqueio
 * real é server-side + RLS.
 */

export type NavItem = {
  /** Label exatamente como no Figma. */
  readonly label: string;
  readonly href: Route;
  /** Nome do ícone em lucide-react, idêntico ao nome da camada no Figma. */
  readonly icon: string;
  /** Predicado de `domain/auth/policy` que governa a visibilidade. */
  readonly isVisible: (role: Role) => boolean;
};

const always = () => true;

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Início", href: "/dashboard", icon: "home", isVisible: always },
  { label: "Agenda", href: "/agenda", icon: "calendar", isVisible: always },
  { label: "Pacientes", href: "/pacientes", icon: "users", isVisible: always },
  // `/sessoes` não consta do Route Map do Figma, mas o item existe na sidebar
  // de todas as telas. Ver docs/DESIGN_DECISIONS.md #3.
  {
    label: "Sessões",
    href: "/sessoes",
    icon: "message-circle",
    isVisible: canAccessClinicalContent,
  },
  {
    label: "Pendências",
    href: "/pendencias",
    icon: "triangle-alert",
    isVisible: always,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: "credit-card",
    isVisible: canViewFinancials,
  },
  {
    label: "Conhecimento",
    href: "/conhecimento",
    icon: "book-open",
    isVisible: canAccessClinicalContent,
  },
  {
    label: "Supervisor IA",
    href: "/supervisor",
    icon: "sparkles",
    isVisible: canAccessClinicalContent,
  },
  {
    label: "Documentos",
    href: "/documentos",
    icon: "file-text",
    isVisible: (role) => role === "psychologist" || role === "admin",
  },
  {
    label: "Indicadores",
    href: "/indicadores",
    icon: "chart-line",
    isVisible: (role) => role === "psychologist" || role === "admin",
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: "cog",
    isVisible: canAdministerClinic,
  },
] as const;

export function navItemsForRole(role: Role): readonly NavItem[] {
  return NAV_ITEMS.filter((item) => item.isVisible(role));
}
