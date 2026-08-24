"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Clinic, Profile } from "@/domain/auth/types";
import { cn } from "@/lib/cn";

import { NavIcon } from "./nav-icon";
import { navItemsForRole } from "./nav-items";

/**
 * Sidebar — spec medida no frame `Sidebar` (6:41) de `06 — DESKTOP`,
 * idêntico nas 25 telas com shell.
 *
 *   w 260 · bg background-primary · border-r border-default · p 24
 *   brand: logomark 32 + wordmark Newsreader Bold 22px, gap 8
 *   gap brand -> nav: 32 · gap entre itens: 4
 *   item: px 12 · py 10 · radius 8 · gap 12 · ícone 18
 *   ativo: bg surface-hover + border border-default, label SemiBold action-primary
 *   rodapé: separador + avatar 40 + nome 14 SemiBold + clínica 12 Regular
 *
 * Desvio deliberado do arquivo: nos frames, os labels INATIVOS estão em #FFFFFF
 * sobre fundo #FFFFFF — invisíveis, contraste 1:1. É resíduo de uma direção
 * escura anterior, e implementar como está violaria a regra de produto do
 * próprio Figma ("WCAG AA minimum, 4.5:1"). Usamos `text-secondary` (6.4:1).
 * Ver docs/DESIGN_DECISIONS.md #1.
 *
 * Abaixo de 1280px colapsa para o rail de 56px, icon-only, medido em
 * `07 — TABLET`. Ver docs/DESIGN_DECISIONS.md #2.
 */
export function Sidebar({
  profile,
  clinic,
}: {
  profile: Profile;
  clinic: Clinic;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(profile.role);

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "flex h-full flex-col justify-between",
        "border-r border-border-default bg-background-primary",
        "w-sidebar-rail items-center px-2 py-6",
        "desktop:w-sidebar desktop:items-stretch desktop:p-6",
      )}
    >
      <div className="flex flex-col gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 rounded-md">
          <span
            aria-hidden
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-md",
              "bg-action-primary font-display text-base font-bold text-text-inverse",
            )}
          >
            S
          </span>
          <span className="hidden font-display text-[22px] font-bold text-text-primary desktop:inline">
            {clinic.name}
          </span>
        </Link>

        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center gap-3 rounded-md border px-3 py-2.5",
                    "duration-fast text-body transition-colors ease-standard",
                    // Alvo de toque mínimo de 44px no rail de tablet, exigido
                    // por `10 — DEV HANDOFF / Accessibility`. No desktop o item
                    // volta aos 38px medidos no frame Sidebar (6:41).
                    "min-h-11 desktop:min-h-0 desktop:justify-start",
                    isActive
                      ? "border-border-default bg-surface-hover font-semibold text-action-primary"
                      : cn(
                          "border-transparent font-medium text-text-secondary",
                          "hover:bg-surface-hover hover:text-action-primary",
                        ),
                  )}
                >
                  <NavIcon name={item.icon} />
                  <span className="hidden desktop:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        <hr className="hidden border-border-default desktop:block" />
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-full",
              "bg-surface-hover text-body-sm font-semibold text-action-primary",
            )}
          >
            {initialsOf(profile.fullName)}
          </span>
          <span className="hidden min-w-0 flex-col gap-0.5 desktop:flex">
            <span className="truncate text-body font-semibold text-text-primary">
              {profile.fullName}
            </span>
            <span className="truncate text-caption text-text-secondary">
              {clinic.name}
            </span>
          </span>
        </div>
      </div>
    </nav>
  );
}

function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]![0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : "";
  return (first + last).toUpperCase();
}
