import type { Metadata } from "next";

import { Card, CardTitle } from "@/components/ui";
import {
  DESCRICAO_PAPEL,
  ORDEM_DOS_PAPEIS,
  ROTULO_PAPEL,
} from "@/domain/auth/membros";
import type { Role } from "@/domain/auth/types";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { TabelaDeMembros } from "./tabela-de-membros";

/**
 * `/configuracoes/usuarios` — frame `usuarios-permissoes` (6:4989).
 *
 * O guard de admin está no layout de `/configuracoes`. A RLS de `profiles` e
 * de `invitations` é a camada real: `invitations_select_admin` só devolve
 * linhas para admin da própria clínica.
 */

export const metadata: Metadata = {
  title: "Usuários e Permissões — Serenità",
};

export type Membro = {
  id: string;
  nome: string;
  papel: Role;
  arquivado: boolean;
};

export type ConvitePendente = {
  id: string;
  email: string;
  papel: Role;
};

export default async function UsuariosPage() {
  const viewer = await requireViewer();
  const supabase = await createSupabaseServerClient();

  const [{ data: perfis }, { data: convites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, archived_at")
      .order("full_name"),
    supabase
      .from("invitations")
      .select("id, email, role")
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const membros: Membro[] = (perfis ?? []).map((p) => ({
    id: p.id,
    nome: p.full_name,
    papel: p.role,
    arquivado: p.archived_at !== null,
  }));

  const pendentes: ConvitePendente[] = (convites ?? []).map((c) => ({
    id: c.id,
    email: c.email,
    papel: c.role,
  }));

  return (
    <>
      <TabelaDeMembros
        membros={membros}
        pendentes={pendentes}
        idDoViewer={viewer.userId}
      />

      {/* Níveis de Acesso (6:5143) — 3 cartões de largura igual. */}
      <Card variant="outlined" className="gap-4 rounded-[20px] p-6">
        <CardTitle className="font-display text-h3 font-bold">
          Níveis de Acesso (RBAC)
        </CardTitle>
        <div className="flex flex-col gap-4 desktop:flex-row">
          {ORDEM_DOS_PAPEIS.map((papel) => (
            <div
              key={papel}
              className="flex flex-1 flex-col gap-2 rounded-xl bg-background-secondary p-4"
            >
              <p className="text-body font-bold text-text-primary">
                {ROTULO_PAPEL[papel]}
              </p>
              <p className="text-body-sm text-text-secondary">
                {DESCRICAO_PAPEL[papel]}
              </p>
            </div>
          ))}
        </div>
        {/*
          A cópia destes cartões diverge do frame 6:5148, que descreve o admin
          com acesso a prontuários. Seguimos a RBAC Matrix, que é o que o banco
          aplica. Ver docs/DESIGN_DECISIONS.md #23.
        */}
        <p className="text-caption text-text-muted">
          O acesso é aplicado no banco por Row Level Security, não apenas nesta
          interface.
        </p>
      </Card>
    </>
  );
}
