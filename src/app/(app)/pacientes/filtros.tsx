"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Input } from "@/components/ui";
import {
  FILTROS,
  type FiltroDeStatus,
  ROTULO_STATUS,
} from "@/domain/paciente/types";
import { cn } from "@/lib/cn";

/**
 * Filtro de status e busca — frame 6:573.
 *
 * Spec medida: trilho bg background-primary · border default · p 4 · radius 8 ·
 * gap 8; item px 16 · py 8 · radius 6 · 14 SemiBold; ativo bg surface-hover +
 * action-primary.
 *
 * O estado vive na URL, não em `useState`. Isso faz a busca ser
 * compartilhável, sobreviver a recarregar a página e ao botão voltar — e é o
 * que permite a lista continuar sendo Server Component.
 */

/** `03 — PATTERNS`: busca com debounce de 300ms. */
const DEBOUNCE_MS = 300;

const ROTULO_FILTRO: Record<FiltroDeStatus, string> = {
  todos: "Todos",
  ...ROTULO_STATUS,
};

export function Filtros({
  filtroAtual,
  termoAtual,
}: {
  filtroAtual: FiltroDeStatus;
  termoAtual: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendente, iniciarTransicao] = useTransition();

  const [termo, setTermo] = useState(termoAtual);

  function navegar(mudancas: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor === null || valor === "") params.delete(chave);
      else params.set(chave, valor);
    }
    const query = params.toString();
    // `typedRoutes` só valida literais; aqui o caminho vem de `usePathname` e a
    // query é montada em tempo de execução.
    const destino = (query ? `${pathname}?${query}` : pathname) as Route;
    iniciarTransicao(() => {
      router.replace(destino);
    });
  }

  useEffect(() => {
    // Não navega enquanto o texto ainda é o da URL — evita um replace inútil
    // na montagem e ao voltar pelo histórico.
    if (termo === termoAtual) return;

    const id = setTimeout(() => navegar({ q: termo }), DEBOUNCE_MS);
    return () => clearTimeout(id);
    // `navegar` depende de searchParams a cada render; incluí-lo reiniciaria o
    // timer sem necessidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo, termoAtual]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div
        role="group"
        aria-label="Filtrar por status"
        className="flex gap-2 rounded-md border border-border-default bg-background-primary p-1"
      >
        {FILTROS.map((valor) => {
          const ativo = valor === filtroAtual;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={ativo}
              onClick={() =>
                navegar({ status: valor === "todos" ? null : valor })
              }
              className={cn(
                "rounded-sm px-4 py-2 text-body font-semibold",
                "duration-fast transition-colors ease-standard",
                ativo
                  ? "bg-surface-hover text-action-primary"
                  : "text-text-secondary hover:bg-surface-hover",
              )}
            >
              {ROTULO_FILTRO[valor]}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-[320px]">
        <Input
          label="Buscar paciente"
          type="search"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          placeholder="Nome, CPF ou telefone"
          className="bg-background-primary"
          hint={pendente ? "Buscando…" : undefined}
        />
      </div>
    </div>
  );
}
