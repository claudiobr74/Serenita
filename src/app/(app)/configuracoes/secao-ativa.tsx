"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

/**
 * Item da sub-navegação de Configurações.
 *
 * Client Component apenas porque precisa de `usePathname` para marcar o ativo —
 * o resto do shell permanece no servidor.
 */
export function SecaoAtiva({ href, rotulo }: { href: string; rotulo: string }) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href as Route}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "block rounded-md px-3 py-2.5 text-body",
        "duration-fast transition-colors ease-standard",
        ativo
          ? "bg-surface-hover font-semibold text-action-primary"
          : "font-medium text-text-secondary hover:bg-surface-hover",
      )}
    >
      {rotulo}
    </Link>
  );
}
