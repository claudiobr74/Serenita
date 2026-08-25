import "server-only";

import { cache } from "react";

import type { CareModality, PatientStatus } from "@/domain/paciente/types";
import {
  type SecaoDoProntuario,
  SECOES_DO_PRONTUARIO,
} from "@/domain/prontuario/secoes";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Carrega um paciente pelo id.
 *
 * Devolve `null` tanto para inexistente quanto para invisível sob RLS — e essa
 * indistinção é **deliberada**. Um psicólogo tentando abrir o paciente de um
 * colega deve ver a mesma coisa que veria com um id inventado: nada. Distinguir
 * confirmaria a existência do paciente, que já é informação.
 *
 * `cache()` memoiza por render pass: o layout carrega para o banner e a página
 * carrega de novo sem custo.
 */

export type PacienteDetalhado = {
  readonly id: string;
  readonly displayCode: string;
  readonly fullName: string;
  readonly cpf: string | null;
  readonly birthDate: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly occupation: string | null;
  readonly status: PatientStatus;
  readonly modality: CareModality | null;
  readonly assignedPsychologistId: string | null;
  readonly createdAt: string;
  readonly tcleAcceptedAt: string | null;
  readonly aiConsentAt: string | null;
};

export const carregarPaciente = cache(
  async (id: string): Promise<PacienteDetalhado | null> => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("patients")
      .select(
        "id, display_code, full_name, cpf, birth_date, phone, email, occupation, status, modality, assigned_psychologist_id, created_at, tcle_accepted_at, ai_consent_at",
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      displayCode: data.display_code,
      fullName: data.full_name,
      cpf: data.cpf,
      birthDate: data.birth_date,
      phone: data.phone,
      email: data.email,
      occupation: data.occupation,
      status: data.status,
      modality: data.modality,
      assignedPsychologistId: data.assigned_psychologist_id,
      createdAt: data.created_at,
      tcleAcceptedAt: data.tcle_accepted_at,
      aiConsentAt: data.ai_consent_at,
    };
  },
);

/**
 * Acolhimento clínico do paciente.
 *
 * A RLS já garante que só o psicólogo designado receba linha — não há checagem
 * de papel aqui, e não deve haver: duplicá-la daria a impressão de que a
 * proteção é desta função.
 */
export const carregarAcolhimento = cache(async (pacienteId: string) => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("patient_clinical_intake")
    .select("therapeutic_approach, suggested_frequency")
    .eq("patient_id", pacienteId)
    .maybeSingle();

  return data ?? null;
});

/**
 * Conteúdo do prontuário, por seção — frame `prontuario` (6:1658).
 *
 * Como em `carregarAcolhimento`, não há checagem de papel nem de designação:
 * a RLS de `patient_clinical_record` já responde vazio para quem não é o
 * psicólogo designado.
 *
 * Seções sem linha no banco voltam como string vazia — um prontuário recém
 * aberto tem as quatro seções, todas em branco.
 */
export const carregarProntuario = cache(
  async (pacienteId: string): Promise<Record<SecaoDoProntuario, string>> => {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
      .from("patient_clinical_record")
      .select("section, content")
      .eq("patient_id", pacienteId);

    const secoes = Object.fromEntries(
      SECOES_DO_PRONTUARIO.map((secao) => [secao, ""]),
    ) as Record<SecaoDoProntuario, string>;

    for (const linha of data ?? []) {
      secoes[linha.section] = linha.content;
    }

    return secoes;
  },
);
