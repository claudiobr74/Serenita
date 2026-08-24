"use client";

import {
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { AlertBanner, Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";

import {
  enviarMagicLink,
  entrarComSenha,
  type EstadoFormulario,
} from "./actions";

/**
 * Formulário de login — frame `login` (6:9).
 *
 * Spec medida em 6:11:
 *   card w 440 · p 48 · gap 40 · radius 24 · bg background-primary
 *        border border-default · shadow 0 16 24 rgba(31,36,33,.04)
 *   form gap 20 · campo gap 8 · label 13 SemiBold
 *   caixa do campo: p 12 · radius 8 · bg background-secondary · border default
 *   ações gap 12 · pt 8 · botão p 14 · radius 8 · 14 SemiBold
 *
 * Os campos usam `bg-background-secondary`, e não o `background-primary` do
 * component set Input: o card é branco, então o campo precisa do tom quente
 * para se destacar. É desvio de tela, não mudança de componente.
 */

const CAMPO_NO_CARD = "bg-background-secondary";

export function LoginForm({
  next,
  erroInicial,
}: {
  next?: string;
  erroInicial?: string;
}) {
  const [estadoSenha, acaoSenha, enviandoSenha] = useActionState<
    EstadoFormulario | undefined,
    FormData
  >(entrarComSenha, undefined);

  const [estadoLink, acaoLink, enviandoLink] = useActionState<
    EstadoFormulario | undefined,
    FormData
  >(enviarMagicLink, undefined);

  const [senhaVisivel, setSenhaVisivel] = useState(false);

  // O e-mail é controlado porque DOIS formulários precisam do mesmo valor: o de
  // senha e o de magic link. Sem isso o segundo enviaria vazio, já que um input
  // só pertence ao form que o contém.
  const [email, setEmail] = useState("");

  // O erro vindo da URL (link expirado no callback) só vale até a primeira
  // tentativa nesta tela.
  const erro = estadoSenha?.erro ?? estadoLink?.erro ?? erroInicial;
  const aviso = estadoLink?.aviso;

  return (
    <div className="flex w-full flex-col gap-5">
      {erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível entrar"
          description={erro}
        />
      )}
      {aviso && !erro && (
        <AlertBanner
          icon={MailIcon}
          tone="info"
          title="Verifique seu e-mail"
          description={aviso}
        />
      )}

      <form action={acaoSenha} className="flex w-full flex-col gap-5">
        <input type="hidden" name="next" value={next ?? ""} />

        <Input
          label="E-mail profissional"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="mariana.costa@clinic.com.br"
          className={CAMPO_NO_CARD}
        />

        <Input
          label="Senha"
          name="senha"
          type={senhaVisivel ? "text" : "password"}
          autoComplete="current-password"
          required
          className={cn(CAMPO_NO_CARD, !senhaVisivel && "font-mono")}
          labelAction={
            <Link
              href="/recuperar"
              className="rounded-sm text-caption text-action-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          }
          trailing={
            <button
              type="button"
              onClick={() => setSenhaVisivel((v) => !v)}
              aria-pressed={senhaVisivel}
              aria-label={senhaVisivel ? "Ocultar senha" : "Mostrar senha"}
              className="rounded-sm text-text-secondary hover:text-text-primary"
            >
              {senhaVisivel ? (
                <EyeOffIcon size={16} aria-hidden />
              ) : (
                <EyeIcon size={16} aria-hidden />
              )}
            </button>
          }
        />

        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="cta"
            className="w-full"
            loading={enviandoSenha}
          >
            Entrar no Serenitá
          </Button>
        </div>
      </form>

      {/*
        Magic link é exigido pela Fase 3 do IMPLEMENTATION_PLAN, mas NÃO existe
        no frame 6:9 — que traz apenas senha e Google. Entra como ação
        secundária, no lugar visual do botão do Google.
        Ver docs/DESIGN_DECISIONS.md #19.
      */}
      <form action={acaoLink} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next ?? ""} />
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="outline"
          size="cta"
          className="w-full"
          loading={enviandoLink}
          formNoValidate
        >
          Receber link de acesso por e-mail
        </Button>
      </form>

      {/*
        Google OAuth está desenhado no frame, mas depende de credencial que a
        Fase 5 traz. Renderizado desabilitado em vez de omitido, para que a tela
        continue batendo com o Figma. Ver docs/DESIGN_DECISIONS.md #20.
      */}
      <Button
        variant="outline"
        size="cta"
        className="w-full"
        disabled
        title="Disponível quando o Google Calendar for integrado, na Fase 5."
      >
        <GlobeIcon size={18} aria-hidden />
        Continuar com Google
      </Button>
    </div>
  );
}
