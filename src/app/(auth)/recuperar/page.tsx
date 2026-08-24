import type { Metadata } from "next";
import Link from "next/link";

import { RecuperarForm } from "./recuperar-form";

/**
 * `/recuperar` — recuperação de senha.
 *
 * Sem frame próprio no Figma: o link "Esqueci minha senha" (6:26) aponta para
 * `/recuperar`, mas a tela não foi desenhada. Reusa a moldura do card de login.
 * Ver docs/DESIGN_DECISIONS.md #22.
 */

export const metadata: Metadata = {
  title: "Recuperar senha — Serenità",
};

export default function RecuperarPage() {
  return (
    <div className="flex w-full flex-col gap-8 rounded-3xl border border-border-default bg-background-primary p-12 shadow-lg">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-h2 font-bold text-text-primary">
          Recuperar senha
        </h1>
        <p className="text-body text-text-secondary">
          Informe o e-mail da sua conta. Enviamos um link para você definir uma
          senha nova.
        </p>
      </header>

      <RecuperarForm />

      <Link
        href="/login"
        className="rounded-sm text-center text-body-sm text-action-primary hover:underline"
      >
        Voltar para o login
      </Link>
    </div>
  );
}
