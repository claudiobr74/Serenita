"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apenasDigitos, cpfValido } from "@/domain/paciente/cpf";
import { CARE_MODALITY } from "@/domain/paciente/types";
import { registrarAuditoria } from "@/server/auth/audit";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Cadastro de paciente — frame `novo-paciente` (6:5292).
 *
 * O frame tem três seções, e elas **não** vão para o mesmo lugar:
 *
 *   1. Dados Pessoais          -> `patients`
 *   2. Informações Clínicas    -> `patient_clinical_intake`, só psicólogo
 *   3. Termos & Consentimentos -> colunas de gate em `patients`
 *
 * Ver docs/DESIGN_DECISIONS.md #39.
 */

export type EstadoCadastro = {
  erro?: string;
  erros?: Partial<Record<"nome" | "cpf" | "nascimento" | "telefone", string>>;
};

const esquema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome completo.")
    .max(160, "No máximo 160 caracteres."),
  // Obrigatório no frame (6:5391), e é a chave de identificação do paciente.
  cpf: z
    .string()
    .trim()
    .min(1, "Informe o CPF.")
    .refine(cpfValido, "CPF inválido.")
    .transform(apenasDigitos),
  nascimento: z
    .string()
    .trim()
    .min(1, "Informe a data de nascimento.")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida.")
    .refine((v) => new Date(v) < new Date(), "A data não pode ser no futuro."),
  telefone: z.string().trim().min(1, "Informe o telefone.").max(32),
  email: z
    .string()
    .trim()
    .max(160)
    .transform((v) => (v === "" ? null : v))
    .refine(
      (v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
      "E-mail inválido.",
    ),
  profissao: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v === "" ? null : v)),
  modalidade: z.enum(CARE_MODALITY).nullable().catch(null),
  tcle: z.coerce.boolean(),
  consentimentoIa: z.coerce.boolean(),
  // Seção 2 — só é lida quando quem cadastra tem acesso clínico.
  abordagem: z.string().trim().max(160).optional(),
  frequencia: z.string().trim().max(80).optional(),
  demanda: z.string().trim().max(4000).optional(),
});

export async function cadastrarPaciente(
  _anterior: EstadoCadastro | undefined,
  formData: FormData,
): Promise<EstadoCadastro> {
  const viewer = await requireViewer();

  const analise = esquema.safeParse({
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    nascimento: formData.get("nascimento"),
    telefone: formData.get("telefone"),
    email: formData.get("email") ?? "",
    profissao: formData.get("profissao") ?? "",
    modalidade: formData.get("modalidade"),
    tcle: formData.get("tcle") === "on",
    consentimentoIa: formData.get("consentimentoIa") === "on",
    abordagem: formData.get("abordagem") ?? "",
    frequencia: formData.get("frequencia") ?? "",
    demanda: formData.get("demanda") ?? "",
  });

  if (!analise.success) {
    const erros: EstadoCadastro["erros"] = {};
    for (const problema of analise.error.issues) {
      const campo = problema.path[0];
      if (
        campo === "nome" ||
        campo === "cpf" ||
        campo === "nascimento" ||
        campo === "telefone"
      ) {
        erros[campo] ??= problema.message;
      }
    }
    return { erro: "Confira os campos destacados.", erros };
  }

  const dados = analise.data;
  const agora = new Date().toISOString();
  const supabase = await createSupabaseServerClient();

  // Quem cadastra sendo psicólogo já fica designado. Secretária e admin
  // cadastram sem designação — a atribuição vira ato explícito, e até lá o
  // paciente não tem conteúdo clínico associado a ninguém.
  const clinico = viewer.profile.role === "psychologist";

  const { data: paciente, error } = await supabase
    .from("patients")
    .insert({
      clinic_id: viewer.clinic.id,
      // `display_code` é sobrescrito pelo trigger; o tipo gerado o exige.
      display_code: "",
      full_name: dados.nome,
      cpf: dados.cpf,
      birth_date: dados.nascimento,
      phone: dados.telefone,
      email: dados.email,
      occupation: dados.profissao,
      modality: dados.modalidade,
      assigned_psychologist_id: clinico ? viewer.userId : null,
      created_by: viewer.userId,
      tcle_accepted_at: dados.tcle ? agora : null,
      ai_consent_at: dados.consentimentoIa ? agora : null,
    })
    .select("id, display_code")
    .single();

  if (error || !paciente) {
    // 23505 = unique_violation, do índice parcial de CPF por clínica.
    if (error?.code === "23505") {
      return {
        erro: "Já existe um paciente com este CPF nesta clínica.",
        erros: { cpf: "CPF já cadastrado." },
      };
    }
    return { erro: "Não foi possível cadastrar agora. Tente novamente." };
  }

  // Seção 2 só é gravada por quem tem acesso clínico. A RLS de
  // `patient_clinical_intake` recusaria de qualquer forma; barrar aqui evita
  // um erro cru depois de o paciente já ter sido criado.
  const temConteudoClinico =
    Boolean(dados.abordagem) ||
    Boolean(dados.frequencia) ||
    Boolean(dados.demanda);

  if (clinico && temConteudoClinico) {
    await supabase.from("patient_clinical_intake").insert({
      patient_id: paciente.id,
      clinic_id: viewer.clinic.id,
      therapeutic_approach: dados.abordagem || null,
      suggested_frequency: dados.frequencia || null,
      initial_complaint: dados.demanda || null,
      created_by: viewer.userId,
    });
  }

  await registrarAuditoria({
    action: "patient.created",
    resourceType: "patient",
    resourceId: paciente.id,
    // Metadado seguro: NUNCA nome, CPF ou conteúdo clínico. A trilha é lida
    // por admin, que não tem acesso clínico. Ver ARCHITECTURE.md §13.
    metadata: {
      display_code: paciente.display_code,
      com_acolhimento_clinico: clinico && temConteudoClinico,
    },
  });

  revalidatePath("/pacientes");
  redirect("/pacientes" as Route);
}
