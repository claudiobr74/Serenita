import type { Metadata } from "next";
import Link from "next/link";

import { ROTULO_PAPEL } from "@/domain/auth/membros";
import { getAuthenticatedUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

import { ConviteForm } from "./convite-form";

/**
 * `/convite/[token]` — aceite de convite.
 *
 * Sem frame no Figma: o fluxo de convite aparece na tabela de membros
 * (6:5135), mas a tela que o convidado vê não foi desenhada. Reusa a moldura do
 * card de login. Ver docs/DESIGN_DECISIONS.md #31.
 *
 * Rota **pública**: quem chega ainda não tem conta. Está em `ROTAS_PUBLICAS` no
 * `proxy.ts`. A autorização real é a função `accept_invitation`, que exige
 * sessão com o e-mail do convite.
 */

export const metadata: Metadata = {
  title: "Convite — Serenità",
  // Um link de convite não deve entrar em índice de busca.
  robots: { index: false, follow: false },
};

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: previa } = await supabase.rpc("invitation_preview", {
    convite_token: token,
  });
  const convite = previa?.[0];

  if (!convite || convite.expirado) {
    return (
      <Moldura titulo="Convite indisponível">
        <p className="text-body text-text-secondary">
          {convite?.expirado
            ? "Este convite expirou."
            : "Este convite não é mais válido. Ele pode ter sido cancelado ou já usado."}{" "}
          Peça um novo ao administrador da clínica.
        </p>
        <Link
          href="/login"
          className="rounded-sm text-center text-body-sm text-action-primary hover:underline"
        >
          Ir para o login
        </Link>
      </Moldura>
    );
  }

  const usuario = await getAuthenticatedUser();
  const emailDaSessao = usuario?.email?.toLowerCase() ?? null;
  const emailDoConvite = convite.email.toLowerCase();

  // Sessão de outra pessoa: aceitar criaria perfil para a conta errada. A
  // função do banco recusaria, mas explicar aqui evita um erro sem saída.
  if (emailDaSessao && emailDaSessao !== emailDoConvite) {
    return (
      <Moldura titulo="Conta diferente">
        <p className="text-body text-text-secondary">
          Você está conectada como <strong>{emailDaSessao}</strong>, mas este
          convite é para <strong>{convite.email}</strong>.
        </p>
        <p className="text-body-sm text-text-muted">
          Saia da conta atual e entre com o e-mail que recebeu o convite.
        </p>
        <Link
          href="/login"
          className="rounded-sm text-center text-body-sm text-action-primary hover:underline"
        >
          Ir para o login
        </Link>
      </Moldura>
    );
  }

  return (
    <Moldura titulo={`Convite para ${convite.clinica}`}>
      <p className="text-body text-text-secondary">
        Você foi convidada para <strong>{convite.clinica}</strong> como{" "}
        <strong>{ROTULO_PAPEL[convite.papel]}</strong>.
      </p>

      <ConviteForm
        token={token}
        email={convite.email}
        temSessao={emailDaSessao !== null}
      />
    </Moldura>
  );
}

function Moldura({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-6 rounded-3xl border border-border-default bg-background-primary p-12 shadow-lg">
      <header className="flex flex-col items-center gap-4">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-action-primary font-display text-[28px] font-bold text-text-inverse"
        >
          S
        </span>
        <h1 className="text-center font-display text-h2 font-bold text-text-primary">
          {titulo}
        </h1>
      </header>
      {children}
    </div>
  );
}
