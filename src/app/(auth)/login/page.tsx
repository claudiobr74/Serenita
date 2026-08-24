import type { Metadata } from "next";

import { MENSAGEM } from "@/domain/auth/errors";

import { LoginForm } from "./login-form";

/**
 * `/login` — frame `login` (6:9).
 *
 * Server Component: o formulário interativo é um Client Component filho, para
 * que só ele vá no bundle do cliente.
 *
 * O guard de sessão vive no `proxy.ts` (checagem otimista) e em
 * `requireViewer()` (checagem real). Esta página não decide acesso.
 */

export const metadata: Metadata = {
  title: "Entrar — Serenità",
};

const ERRO_DA_URL: Record<string, string> = {
  link_expirado: MENSAGEM.link_expirado,
  link_invalido: MENSAGEM.link_expirado,
  sessao_expirada: "Sua sessão expirou. Entre novamente para continuar.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;

  return (
    <div className="flex w-full flex-col gap-10 rounded-3xl border border-border-default bg-background-primary p-12 shadow-lg">
      <header className="flex flex-col items-center gap-4">
        {/*
          LogoMark (6:13) — 120px. O PNG exportado do Figma não pôde ser baixado
          neste ambiente; enquanto `public/brand/logomark.png` não existe, vale
          o mesmo tratamento de marca já usado na Sidebar, na geometria do
          frame. Ver docs/DESIGN_DECISIONS.md #21.
        */}
        <span
          aria-hidden
          className="grid size-[120px] shrink-0 place-items-center rounded-3xl bg-action-primary font-display text-[56px] font-bold text-text-inverse"
        >
          S
        </span>
        <h1 className="sr-only">Entrar no Serenità</h1>
        <p className="text-center text-body text-text-secondary">
          Tudo o que você precisa para cuidar dos seus pacientes.
        </p>
      </header>

      <LoginForm
        next={next}
        erroInicial={erro ? ERRO_DA_URL[erro] : undefined}
      />

      <p className="text-center text-caption text-text-muted">
        Protegido por criptografia clínica de ponta a ponta.
      </p>
    </div>
  );
}
