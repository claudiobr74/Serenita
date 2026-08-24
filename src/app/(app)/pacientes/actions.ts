"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PATIENT_STATUS } from "@/domain/paciente/types";
import { registrarAuditoria } from "@/server/auth/audit";
import { requireViewer } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Mudança de status do paciente.
 *
 * O frame da lista traz as abas Ativos, Arquivados e Encerrados (6:576–6:581),
 * mas **não desenha como se muda de status** — nenhuma ação da tabela faz
 * isso. Sem essa ação, duas das três abas nunca teriam conteúdo.
 * Ver docs/DESIGN_DECISIONS.md #40.
 *
 * Não é exclusão. `patients` não tem policy de DELETE de propósito: a Fase 4
 * prevê exclusão com confirmação e aprovação de admin, que é fluxo próprio.
 * A RLS de `patients_update` já limita quem pode mexer em quem — psicólogo só
 * nos próprios, admin e secretária em todos da clínica.
 */

export type EstadoStatus = { erro?: string; aviso?: string };

export async function alterarStatusDoPaciente(
  _anterior: EstadoStatus | undefined,
  formData: FormData,
): Promise<EstadoStatus> {
  await requireViewer();

  const analise = z
    .object({ id: z.string().uuid(), status: z.enum(PATIENT_STATUS) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });

  if (!analise.success) return { erro: "Dados inválidos." };

  const { id, status } = analise.data;
  const supabase = await createSupabaseServerClient();

  const { error, count } = await supabase
    .from("patients")
    .update({ status }, { count: "exact" })
    .eq("id", id);

  if (error) return { erro: "Não foi possível alterar o status." };

  // Zero linhas significa que a RLS barrou — provavelmente um psicólogo
  // tentando mexer em paciente de colega. Dizer "não foi possível" em vez de
  // "sem permissão" evita confirmar que o paciente existe.
  if (count === 0) return { erro: "Não foi possível alterar o status." };

  await registrarAuditoria({
    action: "patient.status_changed",
    resourceType: "patient",
    resourceId: id,
    metadata: { status_novo: status },
  });

  revalidatePath("/pacientes");
  return { aviso: "Status atualizado." };
}
