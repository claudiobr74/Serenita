"use server";

import { z } from "zod";

import {
  LIMITE_DA_SECAO,
  SECOES_DO_PRONTUARIO,
} from "@/domain/prontuario/secoes";
import { registrarAuditoria } from "@/server/auth/audit";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Gravação de uma seção do prontuário.
 *
 * Chamada pelo autosave, não por submit de formulário — mas continua sendo um
 * endpoint público como qualquer Server Action, e por isso valida tudo e passa
 * por `requireViewer()` antes de tocar no banco.
 *
 * **Não revalida a rota.** `revalidatePath` a cada 500ms de digitação
 * re-renderizaria a página inteira em cima do textarea onde a pessoa está
 * escrevendo. O cliente já é dono do texto; o servidor só confirma.
 *
 * A auditoria registra QUE a seção mudou, nunca o que passou a dizer —
 * docs/ARCHITECTURE.md §13. O conteúdo anterior fica em
 * `patient_clinical_record_revision`, sob a mesma RLS clínica do prontuário.
 */

const Entrada = z.object({
  pacienteId: z.string().uuid(),
  secao: z.enum(SECOES_DO_PRONTUARIO),
  conteudo: z.string().max(LIMITE_DA_SECAO),
});

export type ResultadoDaGravacao = { ok: true } | { ok: false; erro: string };

export async function salvarSecaoDoProntuario(
  pacienteId: string,
  secao: string,
  conteudo: string,
): Promise<ResultadoDaGravacao> {
  const viewer = await requireViewer();

  const analise = Entrada.safeParse({ pacienteId, secao, conteudo });
  if (!analise.success) {
    return { ok: false, erro: "Conteúdo inválido." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("patient_clinical_record").upsert(
    {
      patient_id: analise.data.pacienteId,
      clinic_id: viewer.profile.clinicId,
      section: analise.data.secao,
      content: analise.data.conteudo,
      updated_by: viewer.userId,
    },
    { onConflict: "patient_id,section" },
  );

  // A RLS barra tanto o papel errado quanto o psicólogo não designado, e nos
  // dois casos a resposta é a mesma: não dá para gravar. Detalhar qual das
  // duas foi diria a um psicólogo se o paciente do colega existe.
  if (error) return { ok: false, erro: "Não foi possível salvar." };

  await registrarAuditoria({
    action: "patient.clinical_record_updated",
    resourceType: "patient_clinical_record",
    resourceId: analise.data.pacienteId,
    metadata: { secao: analise.data.secao },
  });

  return { ok: true };
}
