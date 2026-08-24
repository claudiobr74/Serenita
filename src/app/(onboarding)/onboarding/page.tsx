import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TOTAL_DE_PASSOS } from "@/domain/clinic/types";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { OnboardingForm } from "./onboarding-form";

/**
 * `/onboarding` — frame `onboarding-clinica` (6:5213), passo 1 de 9.
 *
 * Rota Auth + **Admin** no Route Map. O guard aqui é a checagem real; a RLS de
 * `clinics_update_admin` é a terceira camada, então nem um admin forjado no
 * cliente conseguiria gravar.
 *
 * Dos 9 passos que o StepCounter anuncia, só o primeiro está desenhado.
 * Ver docs/DESIGN_DECISIONS.md #25.
 */

export const metadata: Metadata = {
  title: "Configurar clínica — Serenità",
};

const PASSO_ATUAL = 1;

export default async function OnboardingPage() {
  const viewer = await requireViewer();

  // Papel errado não vê a tela nem o formulário. Sem revelar que ela existe:
  // `03 — PATTERNS` manda não expor recurso fora de escopo (DESIGN_DECISIONS #7).
  if (viewer.profile.role !== "admin") redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data: clinica } = await supabase
    .from("clinics")
    .select("name, cnpj, address, phone, kind")
    .eq("id", viewer.clinic.id)
    .maybeSingle();

  const progresso = Math.round((PASSO_ATUAL / TOTAL_DE_PASSOS) * 100);

  return (
    <>
      {/* ProgressBar (6:5215) — 480×4, radius 2, ancorada a 48px do topo. */}
      <div
        className="absolute top-12 left-1/2 h-1 w-[480px] max-w-[calc(100%-4rem)] -translate-x-1/2 overflow-hidden rounded-sm bg-action-secondary"
        role="progressbar"
        aria-valuenow={PASSO_ATUAL}
        aria-valuemin={1}
        aria-valuemax={TOTAL_DE_PASSOS}
        aria-label={`Passo ${PASSO_ATUAL} de ${TOTAL_DE_PASSOS}`}
      >
        <div
          className="h-full rounded-sm bg-action-primary"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div className="flex w-full flex-col gap-10 rounded-3xl border border-border-default bg-background-primary p-12 shadow-lg">
        <header className="flex flex-col items-center gap-4">
          {/* LogoMark (6:5219) — 48px, radius 12, "S" em Newsreader Bold 28. */}
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-action-primary font-display text-[28px] font-bold text-text-inverse"
          >
            S
          </span>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="font-display text-h1 font-bold text-text-primary">
              Bem-vinda ao Serenitá
            </h1>
            <p className="text-body text-text-secondary">
              Vamos configurar sua clínica em poucos minutos.
            </p>
          </div>
        </header>

        {/* StepCounter (6:5224) — pílula surface-hover, 12px SemiBold. */}
        <span className="self-start rounded-full bg-surface-hover px-3 py-1 text-caption font-semibold text-action-primary uppercase">
          Passo {PASSO_ATUAL} de {TOTAL_DE_PASSOS}
        </span>

        <OnboardingForm
          nomeInicial={clinica?.name ?? viewer.clinic.name}
          cnpjInicial={clinica?.cnpj ?? null}
          enderecoInicial={clinica?.address ?? null}
          telefoneInicial={clinica?.phone ?? null}
          tipoInicial={clinica?.kind ?? null}
        />
      </div>
    </>
  );
}
