"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROLES } from "@/domain/auth/types";
import { registrarAuditoria } from "@/server/auth/audit";
import { enviarConvite } from "@/server/email/enviar-convite";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Gestão de membros — frame `usuarios-permissoes` (6:4989).
 *
 * Toda action aqui é privativa de admin. A verificação é feita **três vezes**,
 * de propósito: aqui (para dar erro legível), na RLS (que é o bloqueio real) e
 * na UI (que nem renderiza a ação). Server Action é endpoint público.
 */

export type EstadoMembros = {
  erro?: string;
  aviso?: string;
  /**
   * Link de convite, devolvido ao admin para repasse manual.
   *
   * Enquanto não há provedor de e-mail transacional, o token em claro só existe
   * neste retorno — o banco guarda apenas o SHA-256. Se o admin fechar a tela
   * sem copiar, o convite fica inalcançável e precisa ser revogado e refeito.
   * Ver docs/DESIGN_DECISIONS.md #27.
   */
  linkDeConvite?: string;
};

/** Validade do convite. Curta o bastante para limitar a janela de uso indevido. */
const VALIDADE_DO_CONVITE_EM_DIAS = 7;

async function exigirAdmin() {
  const viewer = await requireViewer();
  if (viewer.profile.role !== "admin") {
    throw new Error("acesso_negado");
  }
  return viewer;
}

/**
 * Convida um membro (6:5101).
 *
 * O token vai para o e-mail; o banco guarda só o SHA-256. Quem lê a tabela não
 * consegue montar um link válido.
 */
export async function convidarMembro(
  _anterior: EstadoMembros | undefined,
  formData: FormData,
): Promise<EstadoMembros> {
  let viewer;
  try {
    viewer = await exigirAdmin();
  } catch {
    return { erro: "Apenas o administrador pode convidar usuários." };
  }

  const analise = z
    .object({
      email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
      papel: z.enum(ROLES),
    })
    .safeParse({ email: formData.get("email"), papel: formData.get("papel") });

  if (!analise.success) {
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, papel } = analise.data;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiraEm = new Date(
    Date.now() + VALIDADE_DO_CONVITE_EM_DIAS * 24 * 60 * 60 * 1000,
  );

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("invitations").insert({
    clinic_id: viewer.clinic.id,
    email,
    role: papel,
    invited_by: viewer.userId,
    token_hash: tokenHash,
    expires_at: expiraEm.toISOString(),
  });

  if (error) {
    // 23505 = unique_violation, do índice parcial de convite pendente.
    if (error.code === "23505") {
      return { erro: `Já existe um convite pendente para ${email}.` };
    }
    return { erro: "Não foi possível enviar o convite agora." };
  }

  await registrarAuditoria({
    action: "invitation.created",
    resourceType: "invitation",
    // E-mail é dado pessoal, mas é o próprio objeto da ação auditada: sem ele
    // a entrada não responde "quem foi convidado".
    metadata: { email, papel },
  });

  revalidatePath("/configuracoes/usuarios");

  const link = `${await origemDaRequisicao()}/convite/${token}`;

  const envio = await enviarConvite({
    para: email,
    clinica: viewer.clinic.name,
    papel,
    link,
    expiraEm,
    convidadoPor: viewer.profile.fullName,
  });

  // O link só continua visível quando o e-mail NÃO chegou de fato — seja
  // porque o adaptador é o de console, seja porque o envio falhou. Com entrega
  // real, exibi-lo seria espalhar sem necessidade a única cópia do token em
  // claro. Ver docs/adr/005-email-transacional.md.
  if (envio.entregue && envio.porEmail) {
    return { aviso: `Convite enviado para ${email}.` };
  }

  return {
    aviso: envio.entregue
      ? `Convite criado para ${email}. O envio automático de e-mail ainda não está configurado — repasse o link abaixo.`
      : `Convite criado para ${email}, mas o e-mail não pôde ser enviado (${envio.motivo}).`,
    linkDeConvite: link,
  };
}

/**
 * Origem absoluta desta requisição.
 *
 * Derivada dos cabeçalhos para funcionar em preview da Vercel, domínio próprio
 * e localhost sem uma variável de ambiente por ambiente.
 */
async function origemDaRequisicao(): Promise<string> {
  const { headers } = await import("next/headers");
  const lista = await headers();
  const host = lista.get("x-forwarded-host") ?? lista.get("host");
  const protocolo = lista.get("x-forwarded-proto") ?? "https";
  return `${protocolo}://${host}`;
}

/** "Cancelar convite" (6:5142) — revoga, não apaga. */
export async function revogarConvite(
  _anterior: EstadoMembros | undefined,
  formData: FormData,
): Promise<EstadoMembros> {
  try {
    await exigirAdmin();
  } catch {
    return { erro: "Apenas o administrador pode cancelar convites." };
  }

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { erro: "Convite inválido." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("accepted_at", null)
    .is("revoked_at", null);

  if (error) return { erro: "Não foi possível cancelar o convite." };

  await registrarAuditoria({
    action: "invitation.revoked",
    resourceType: "invitation",
    resourceId: id.data,
  });

  revalidatePath("/configuracoes/usuarios");
  return { aviso: "Convite cancelado." };
}

/**
 * "Editar permissões" (6:5118) — troca o papel de um membro.
 *
 * O admin NÃO pode mudar o próprio papel: a policy
 * `profiles_update_admin` bloqueia no banco, e barramos aqui para dar mensagem
 * em vez de erro cru. Ver docs/REVIEW_FASES_0_2.md #1.
 */
export async function alterarPapel(
  _anterior: EstadoMembros | undefined,
  formData: FormData,
): Promise<EstadoMembros> {
  let viewer;
  try {
    viewer = await exigirAdmin();
  } catch {
    return { erro: "Apenas o administrador pode alterar permissões." };
  }

  const analise = z
    .object({ id: z.string().uuid(), papel: z.enum(ROLES) })
    .safeParse({ id: formData.get("id"), papel: formData.get("papel") });

  if (!analise.success) return { erro: "Dados inválidos." };

  const { id, papel } = analise.data;

  if (id === viewer.userId) {
    return {
      erro:
        "Você não pode alterar o próprio papel. Peça a outro administrador — " +
        "a separação é proposital.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: papel })
    .eq("id", id);

  if (error) return { erro: "Não foi possível alterar o papel." };

  await registrarAuditoria({
    action: "profile.role_changed",
    resourceType: "profile",
    resourceId: id,
    metadata: { papel_novo: papel },
  });

  revalidatePath("/configuracoes/usuarios");
  return { aviso: "Permissões atualizadas." };
}
