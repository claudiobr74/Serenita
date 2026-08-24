import type { Metadata } from "next";

import { Card, CardTitle } from "@/components/ui";
import { DESCRICAO_PAPEL, ROTULO_PAPEL } from "@/domain/auth/membros";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { PerfilForm } from "./perfil-form";

/**
 * `/configuracoes/perfil` — seção "Perfil profissional" (6:5080).
 *
 * A seção existe na sub-navegação do frame, mas **não tem rota no Route Map
 * nem tela desenhada**. Ver docs/DESIGN_DECISIONS.md #34.
 *
 * Disponível a **todos os papéis**: cada um edita o próprio perfil, e
 * `profiles_update_self` garante no banco que ninguém edite o de outro nem
 * mude o próprio papel.
 */

export const metadata: Metadata = {
  title: "Perfil profissional — Serenità",
};

export default async function PerfilPage() {
  const viewer = await requireViewer();
  const supabase = await createSupabaseServerClient();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, phone, crp, specializations")
    .eq("id", viewer.userId)
    .maybeSingle();

  const clinico = viewer.profile.role === "psychologist";

  return (
    <>
      <Card variant="outlined" className="gap-5 rounded-[20px] p-6">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-display text-h3 font-bold">
            Perfil profissional
          </CardTitle>
          <p className="text-body-sm text-text-secondary">
            Seus dados como profissional. Só você pode alterá-los.
          </p>
        </div>

        <PerfilForm
          nome={perfil?.full_name ?? viewer.profile.fullName}
          telefone={perfil?.phone ?? null}
          crp={perfil?.crp ?? null}
          especializacoes={perfil?.specializations ?? []}
          clinico={clinico}
        />
      </Card>

      {/*
        O papel é exibido, não editado: trocar o próprio papel é bloqueado no
        banco, inclusive para admin, por separação de responsabilidade.
        Ver docs/REVIEW_FASES_0_2.md achado 1.
      */}
      <Card variant="outlined" className="gap-2 rounded-[20px] p-6">
        <CardTitle className="font-display text-h4 font-bold">
          Seu nível de acesso
        </CardTitle>
        <p className="text-body font-semibold text-text-primary">
          {ROTULO_PAPEL[viewer.profile.role]}
        </p>
        <p className="text-body-sm text-text-secondary">
          {DESCRICAO_PAPEL[viewer.profile.role]}
        </p>
        <p className="text-caption text-text-muted">
          O nível de acesso é definido por um administrador da clínica. Ninguém
          altera o próprio — nem o administrador.
        </p>
      </Card>
    </>
  );
}
