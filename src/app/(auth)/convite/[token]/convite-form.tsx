"use client";

import { CircleAlertIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { AlertBanner, Button, Input } from "@/components/ui";

import {
  aceitarConvite,
  criarContaEAceitar,
  type EstadoConvite,
} from "./actions";

/**
 * Dois caminhos, decididos no servidor pela presença de sessão:
 *
 * - com sessão do e-mail certo: só falta o nome
 * - sem sessão: nome + senha criam a conta e aceitam em sequência
 *
 * O campo de e-mail é exibido **desabilitado**: a pessoa precisa ver com qual
 * conta está entrando, mas o valor nunca vem do formulário — vem do convite, no
 * servidor. Ver o comentário de `criarContaEAceitar`.
 */
export function ConviteForm({
  token,
  email,
  temSessao,
}: {
  token: string;
  email: string;
  temSessao: boolean;
}) {
  const [estado, acao, enviando] = useActionState<
    EstadoConvite | undefined,
    FormData
  >(temSessao ? aceitarConvite : criarContaEAceitar, undefined);

  return (
    <div className="flex flex-col gap-5">
      {estado?.erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível aceitar"
          description={estado.erro}
        />
      )}
      {estado?.aviso && !estado.erro && (
        <AlertBanner
          icon={MailIcon}
          tone="info"
          title="Falta um passo"
          description={estado.aviso}
        />
      )}

      <form action={acao} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />

        <Input
          label="E-mail do convite"
          value={email}
          disabled
          readOnly
          className="bg-background-secondary"
        />

        <Input
          label="Seu nome completo"
          name="nome"
          required
          autoComplete="name"
          placeholder="Ex: Dra. Mariana Costa"
          className="bg-background-secondary"
        />

        {!temSessao && (
          <Input
            label="Crie uma senha"
            name="senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            hint="Ao menos 8 caracteres."
            className="bg-background-secondary"
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="cta"
          className="w-full"
          loading={enviando}
        >
          {temSessao ? "Aceitar convite" : "Criar acesso e entrar"}
        </Button>
      </form>

      {!temSessao && (
        <Link
          href="/login"
          className="rounded-sm text-center text-body-sm text-action-primary hover:underline"
        >
          Já tenho conta — entrar
        </Link>
      )}
    </div>
  );
}
