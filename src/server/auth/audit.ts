import "server-only";

import { headers } from "next/headers";

import { getViewer } from "./session";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Escrita no `audit_log`.
 *
 * Requisito global do Dev Handoff: "Audit log em todo create/update/delete de
 * dado sensível".
 *
 * A policy `audit_log_insert_same_clinic` exige `user_id = auth.uid()`, e um
 * trigger impõe o `created_at` do servidor — então nem esta função nem quem a
 * chama conseguem forjar autoria ou data. Ver docs/REVIEW_FASES_0_2.md #2.
 *
 * NUNCA passe conteúdo clínico em `metadata`. A trilha é lida por admin, que
 * por definição não tem acesso clínico; vazar prontuário por aqui contornaria
 * a regra inteira. Ver ARCHITECTURE.md §13.
 */
export async function registrarAuditoria({
  action,
  resourceType,
  resourceId,
  metadata = {},
}: {
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const viewer = await getViewer();
  if (!viewer) return;

  const supabase = await createSupabaseServerClient();
  const lista = await headers();
  // O primeiro IP de `x-forwarded-for` é o do cliente; os demais são proxies.
  const ip = lista.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const { error } = await supabase.from("audit_log").insert({
    clinic_id: viewer.clinic.id,
    user_id: viewer.userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
    metadata: metadata as never,
    ip_address: ip,
  });

  if (error) {
    // A auditoria não pode derrubar a operação que ela audita. Falhar aqui é
    // registrado no servidor e investigado; a ação do usuário segue.
    console.error("[auditoria] falha ao registrar", {
      action,
      resourceType,
      code: error.code,
    });
  }
}
