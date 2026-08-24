"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apenasDigitos, cnpjValido } from "@/domain/clinic/cnpj";
import { CLINIC_KINDS } from "@/domain/clinic/types";
import { registrarAuditoria } from "@/server/auth/audit";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Passo 1 do onboarding — dados da clínica (6:5226).
 *
 * `/onboarding` é rota **Auth + Admin** no Route Map: o wizard não CRIA a
 * clínica, ele completa uma que já existe. Quem provisiona clínica e primeiro
 * admin é o caminho privilegiado de `supabase/seed/`. Ver
 * docs/DESIGN_DECISIONS.md #26.
 */

export type EstadoOnboarding = {
  erro?: string;
  erros?: Partial<Record<"nome" | "cnpj" | "telefone", string>>;
};

const esquema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome do seu espaço ou clínica.")
    .max(120, "No máximo 120 caracteres."),
  // Opcional no frame (6:5235 diz "Opcional"): string vazia vira null.
  cnpj: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || cnpjValido(v), "CNPJ inválido.")
    .transform((v) => (v === null ? null : apenasDigitos(v))),
  endereco: z
    .string()
    .trim()
    .max(240)
    .transform((v) => (v === "" ? null : v)),
  telefone: z
    .string()
    .trim()
    .max(32)
    .transform((v) => (v === "" ? null : v)),
  tipo: z.enum(CLINIC_KINDS).nullable().catch(null),
});

export async function salvarDadosDaClinica(
  _anterior: EstadoOnboarding | undefined,
  formData: FormData,
): Promise<EstadoOnboarding> {
  // Autorização antes de qualquer coisa: Server Action é endpoint público.
  const viewer = await requireViewer();
  if (viewer.profile.role !== "admin") {
    return { erro: "Apenas o administrador da clínica pode fazer isto." };
  }

  const analise = esquema.safeParse({
    nome: formData.get("nome"),
    cnpj: formData.get("cnpj") ?? "",
    endereco: formData.get("endereco") ?? "",
    telefone: formData.get("telefone") ?? "",
    tipo: formData.get("tipo"),
  });

  if (!analise.success) {
    const erros: EstadoOnboarding["erros"] = {};
    for (const problema of analise.error.issues) {
      const campo = problema.path[0];
      if (campo === "nome" || campo === "cnpj" || campo === "telefone") {
        erros[campo] ??= problema.message;
      }
    }
    return { erro: "Confira os campos destacados.", erros };
  }

  const { nome, cnpj, endereco, telefone, tipo } = analise.data;
  const supabase = await createSupabaseServerClient();

  // Sem `clinic_id` no update: a RLS de `clinics_update_admin` já restringe à
  // própria clínica. Passar o id daria a impressão de que ele é confiável.
  const { error } = await supabase
    .from("clinics")
    .update({
      name: nome,
      cnpj,
      address: endereco,
      phone: telefone,
      kind: tipo,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", viewer.clinic.id);

  if (error) {
    return { erro: "Não foi possível salvar agora. Tente novamente." };
  }

  await registrarAuditoria({
    action: "clinic.onboarding_completed",
    resourceType: "clinic",
    resourceId: viewer.clinic.id,
    // Metadado seguro: quais campos foram preenchidos, nunca o conteúdo.
    metadata: {
      campos_preenchidos: Object.entries({ cnpj, endereco, telefone, tipo })
        .filter(([, v]) => v !== null)
        .map(([k]) => k),
    },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** "Pular por enquanto" (6:5258) — sai do wizard sem gravar nada. */
export async function pularOnboarding() {
  await requireViewer();
  redirect("/dashboard");
}
