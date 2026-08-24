"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { classificarErro, MENSAGEM } from "@/domain/auth/errors";
import { destinoSeguro } from "@/domain/auth/redirect";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Server actions da autenticação.
 *
 * O guia do Next é explícito: Server Action tem a mesma superfície de ataque de
 * um endpoint público. Toda entrada é validada aqui, no servidor, e nada
 * depende de validação que só tenha acontecido no browser.
 */

export type EstadoFormulario = {
  erro?: string;
  /** Mensagem de sucesso que não navega — magic link e recuperação de senha. */
  aviso?: string;
  campos?: { email?: string };
};

const esquemaSenha = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe sua senha."),
  next: z.string().optional(),
});

const esquemaEmail = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  next: z.string().optional(),
});

export async function entrarComSenha(
  _anterior: EstadoFormulario | undefined,
  formData: FormData,
): Promise<EstadoFormulario> {
  const analise = esquemaSenha.safeParse({
    email: formData.get("email"),
    senha: formData.get("senha"),
    next: formData.get("next") ?? undefined,
  });

  if (!analise.success) {
    return {
      erro: analise.error.issues[0]?.message ?? MENSAGEM.indisponivel,
      campos: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email, senha, next } = analise.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: MENSAGEM[classificarErro(error)], campos: { email } };
  }

  // `redirect()` lança para interromper a action — precisa ficar FORA de
  // try/catch, senão o catch engole a interrupção e a navegação não acontece.
  //
  // `typedRoutes` só valida literais; para string computada o cast é o escape
  // hatch documentado. Seguro aqui porque `destinoSeguro` já garantiu que é
  // caminho relativo desta aplicação.
  redirect(destinoSeguro(next) as Route);
}

export async function enviarMagicLink(
  _anterior: EstadoFormulario | undefined,
  formData: FormData,
): Promise<EstadoFormulario> {
  const analise = esquemaEmail.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });

  if (!analise.success) {
    return {
      erro: analise.error.issues[0]?.message ?? MENSAGEM.indisponivel,
      campos: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email, next } = analise.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: await urlDeCallback(destinoSeguro(next)),
      // Login, não cadastro: quem não tem conta não vira conta nova.
      // Onboarding de clínica é fluxo próprio, na fatia seguinte da Fase 3.
      shouldCreateUser: false,
    },
  });

  if (error) {
    const codigo = classificarErro(error);
    // Rate limit é real e precisa ser dito. Qualquer outro erro vira a mesma
    // resposta do caminho feliz, para não revelar se o e-mail existe.
    if (codigo === "limite_de_tentativas") {
      return { erro: MENSAGEM.limite_de_tentativas, campos: { email } };
    }
  }

  return {
    aviso: `Se houver uma conta para ${email}, o link de acesso chega em instantes.`,
    campos: { email },
  };
}

export async function enviarRecuperacaoDeSenha(
  _anterior: EstadoFormulario | undefined,
  formData: FormData,
): Promise<EstadoFormulario> {
  const analise = esquemaEmail.safeParse({ email: formData.get("email") });

  if (!analise.success) {
    return {
      erro: analise.error.issues[0]?.message ?? MENSAGEM.indisponivel,
      campos: { email: String(formData.get("email") ?? "") },
    };
  }

  const { email } = analise.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await urlDeCallback("/redefinir"),
  });

  if (error && classificarErro(error) === "limite_de_tentativas") {
    return { erro: MENSAGEM.limite_de_tentativas, campos: { email } };
  }

  // Mesma resposta com ou sem conta — não revela se o e-mail existe.
  return {
    aviso: `Se houver uma conta para ${email}, o link de redefinição chega em até 30 segundos.`,
    campos: { email },
  };
}

export async function sair() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * URL absoluta do callback.
 *
 * O Supabase exige absoluta, e ela precisa refletir o host real da requisição —
 * preview da Vercel, domínio próprio ou localhost. Derivar dos headers evita
 * uma variável de ambiente por ambiente.
 */
async function urlDeCallback(destino: string): Promise<string> {
  const { headers } = await import("next/headers");
  const lista = await headers();
  const host = lista.get("x-forwarded-host") ?? lista.get("host");
  const protocolo = lista.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${host}/auth/callback?next=${encodeURIComponent(destino)}`;
}
