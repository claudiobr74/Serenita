import type { Metadata } from "next";
import Image from "next/image";

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
          LogoMark (6:13) — caixa de 120px, `object-contain` para preservar a
          proporção do lockup. O arquivo tem 1254px; o `next/image` redimensiona
          e serve formato moderno, então o peso de origem não chega ao usuário.
        */}
        <Image
          src="/brand/logomark.png"
          alt=""
          width={120}
          height={120}
          priority
          className="size-[120px] shrink-0 object-contain"
        />
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
