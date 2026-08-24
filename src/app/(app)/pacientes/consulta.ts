import "server-only";

import { escaparCuringa, interpretarBusca } from "@/domain/paciente/busca";
import type { FiltroDeStatus, Paciente } from "@/domain/paciente/types";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Consulta da lista de pacientes.
 *
 * Nenhum filtro aqui é de segurança: a RLS de `patients` já decide quem
 * enxerga quem — psicólogo vê os próprios, admin e secretária veem todos da
 * clínica. Isto é apresentação. Ver a migration 20260824205417.
 */
export async function buscarPacientes({
  filtro,
  termo,
}: {
  filtro: FiltroDeStatus;
  termo: string;
}): Promise<Paciente[]> {
  const supabase = await createSupabaseServerClient();

  let consulta = supabase
    .from("patients")
    .select(
      "id, display_code, full_name, cpf, status, modality, assigned_psychologist_id",
    )
    .order("full_name");

  if (filtro !== "todos") consulta = consulta.eq("status", filtro);

  const busca = interpretarBusca(termo);

  if (busca.tipo === "texto") {
    consulta = consulta.ilike("full_name", `%${escaparCuringa(busca.valor)}%`);
  } else if (busca.tipo === "digitos") {
    // CPF e telefone são guardados só com dígitos, mas `phone` aceita máscara
    // no cadastro — daí o `or` cobrindo as duas colunas, e também o nome, para
    // o caso raro de alguém buscar um nome numérico.
    const d = escaparCuringa(busca.valor);
    const t = escaparCuringa(busca.texto);
    consulta = consulta.or(
      `cpf.ilike.%${d}%,phone.ilike.%${d}%,phone.ilike.%${t}%,full_name.ilike.%${t}%`,
    );
  }

  const { data, error } = await consulta;
  if (error || !data) return [];

  return data.map((linha) => ({
    id: linha.id,
    displayCode: linha.display_code,
    fullName: linha.full_name,
    cpf: linha.cpf,
    status: linha.status,
    modality: linha.modality,
    assignedPsychologistId: linha.assigned_psychologist_id,
  }));
}
