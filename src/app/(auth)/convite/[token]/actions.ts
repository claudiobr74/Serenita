"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Aceite de convite.
 *
 * O trabalho pesado está na função `accept_invitation` do banco, que é
 * `SECURITY DEFINER` e atômica. Aqui só validamos entrada, chamamos e
 * traduzimos o erro.
 *
 * A regra que importa: **o token sozinho não basta**. A função exige sessão
 * cujo e-mail seja o do convite, então interceptar o link não dá acesso sem
 * também controlar a caixa postal.
 */

export type EstadoConvite = { erro?: string; aviso?: string };

/** Erros que a função levanta, traduzidos para o que a pessoa precisa saber. */
const MENSAGEM: Record<string, string> = {
  sem_sessao: "Entre na sua conta para aceitar o convite.",
  nome_obrigatorio: "Informe seu nome completo.",
  convite_invalido:
    "Este convite não é mais válido. Ele pode ter sido cancelado ou já usado. Peça um novo ao administrador.",
  convite_expirado:
    "Este convite expirou. Peça um novo ao administrador da clínica.",
  email_divergente:
    "Este convite é para outro e-mail. Saia da conta atual e entre com o e-mail que recebeu o convite.",
  ja_tem_perfil:
    "Sua conta já pertence a uma clínica. Um perfil pertence a exatamente uma clínica.",
};

function traduzir(mensagemDoBanco: string): string {
  for (const [chave, texto] of Object.entries(MENSAGEM)) {
    if (mensagemDoBanco.includes(chave)) return texto;
  }
  return "Não foi possível aceitar o convite agora. Tente novamente.";
}

const esquema = z.object({
  token: z.string().min(1),
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome completo.")
    .max(120, "No máximo 120 caracteres."),
});

export async function aceitarConvite(
  _anterior: EstadoConvite | undefined,
  formData: FormData,
): Promise<EstadoConvite> {
  const analise = esquema.safeParse({
    token: formData.get("token"),
    nome: formData.get("nome"),
  });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_invitation", {
    convite_token: analise.data.token,
    nome_completo: analise.data.nome,
  });

  if (error) return { erro: traduzir(error.message) };

  // O perfil passou a existir: o layout autenticado precisa reler.
  revalidatePath("/", "layout");
  redirect("/dashboard" as Route);
}

/**
 * Cria a conta e aceita, em sequência.
 *
 * O e-mail NÃO vem do formulário: vem do convite, no servidor. Aceitar campo
 * de e-mail aqui permitiria criar conta com endereço arbitrário e depois
 * bater de frente com `email_divergente` — ou pior, se a checagem mudasse.
 */
export async function criarContaEAceitar(
  _anterior: EstadoConvite | undefined,
  formData: FormData,
): Promise<EstadoConvite> {
  const analise = esquema
    .extend({
      senha: z.string().min(8, "A senha precisa de ao menos 8 caracteres."),
    })
    .safeParse({
      token: formData.get("token"),
      nome: formData.get("nome"),
      senha: formData.get("senha"),
    });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { token, nome, senha } = analise.data;
  const supabase = await createSupabaseServerClient();

  // O e-mail vem da prévia do convite, no servidor.
  const { data: previa } = await supabase.rpc("invitation_preview", {
    convite_token: token,
  });
  const convite = previa?.[0];

  if (!convite) return { erro: MENSAGEM.convite_invalido };
  if (convite.expirado) return { erro: MENSAGEM.convite_expirado };

  const { error: erroCadastro } = await supabase.auth.signUp({
    email: convite.email,
    password: senha,
  });

  if (erroCadastro) {
    // Conta já existente é caminho comum, não erro: a pessoa deve entrar.
    if (erroCadastro.message.toLowerCase().includes("already registered")) {
      return {
        erro: "Você já tem conta com este e-mail. Entre por ela para aceitar o convite.",
      };
    }
    return { erro: "Não foi possível criar sua conta agora." };
  }

  // Com confirmação de e-mail ligada no projeto, `signUp` não devolve sessão —
  // e sem sessão a função de aceite recusa. Detectamos e explicamos, em vez de
  // deixar a pessoa diante de "sem_sessao".
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      aviso:
        "Conta criada. Confirme o e-mail que acabamos de enviar e volte a este link para concluir.",
    };
  }

  const { error } = await supabase.rpc("accept_invitation", {
    convite_token: token,
    nome_completo: nome,
  });

  if (error) return { erro: traduzir(error.message) };

  revalidatePath("/", "layout");
  redirect("/dashboard" as Route);
}
