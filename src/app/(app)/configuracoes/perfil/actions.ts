"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { registrarAuditoria } from "@/server/auth/audit";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Perfil profissional — o próprio.
 *
 * Não há guard de papel: cada um edita o seu, e a policy `profiles_update_self`
 * garante isso no banco. O que ela também garante é que o `role` permaneça
 * igual — este formulário não tem campo de papel, e nem adiantaria ter.
 */

export type EstadoPerfil = {
  erro?: string;
  aviso?: string;
  erros?: Partial<Record<"nome" | "crp", string>>;
};

const esquema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome completo.")
    .max(120, "No máximo 120 caracteres."),
  telefone: z
    .string()
    .trim()
    .max(32)
    .transform((v) => (v === "" ? null : v)),
  crp: z
    .string()
    .trim()
    .max(20)
    .transform((v) => (v === "" ? null : v)),
  /**
   * Especializações chegam como texto separado por vírgula e viram `text[]`.
   *
   * A alternativa seria um MultiSelect, que o design system ainda não tem
   * (DESIGN_DECISIONS #6) e que exigiria uma lista fechada de especializações
   * que ninguém definiu. Campo livre é honesto quanto ao que se sabe hoje.
   */
  especializacoes: z
    .string()
    .trim()
    .transform((v) =>
      v === ""
        ? []
        : v
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .slice(0, 20),
    ),
});

export async function salvarPerfil(
  _anterior: EstadoPerfil | undefined,
  formData: FormData,
): Promise<EstadoPerfil> {
  const viewer = await requireViewer();

  const analise = esquema.safeParse({
    nome: formData.get("nome"),
    telefone: formData.get("telefone") ?? "",
    crp: formData.get("crp") ?? "",
    especializacoes: formData.get("especializacoes") ?? "",
  });

  if (!analise.success) {
    const erros: EstadoPerfil["erros"] = {};
    for (const problema of analise.error.issues) {
      const campo = problema.path[0];
      if (campo === "nome" || campo === "crp")
        erros[campo] ??= problema.message;
    }
    return { erro: "Confira os campos destacados.", erros };
  }

  const { nome, telefone, crp, especializacoes } = analise.data;

  // CRP e especializações só fazem sentido para quem atende. Guardá-los para
  // admin ou secretária seria dado sem significado, e apareceria em telas
  // futuras como se fosse real.
  const clinico = viewer.profile.role === "psychologist";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: nome,
      phone: telefone,
      crp: clinico ? crp : null,
      specializations: clinico ? especializacoes : [],
    })
    .eq("id", viewer.userId);

  if (error) return { erro: "Não foi possível salvar agora. Tente novamente." };

  await registrarAuditoria({
    action: "profile.updated",
    resourceType: "profile",
    resourceId: viewer.userId,
    // Quais campos mudaram, nunca o conteúdo: a trilha é lida por admin.
    metadata: {
      campos: [
        "full_name",
        "phone",
        ...(clinico ? ["crp", "specializations"] : []),
      ],
    },
  });

  // O nome aparece na Sidebar, que vive no layout.
  revalidatePath("/", "layout");
  return { aviso: "Perfil atualizado." };
}
