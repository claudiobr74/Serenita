"use client";

import { useActionState } from "react";

import type { PatientStatus } from "@/domain/paciente/types";

import { alterarStatusDoPaciente, type EstadoStatus } from "./actions";

/**
 * Ação de status na linha da tabela.
 *
 * Um `<form>` por linha, com o alvo em campo oculto: não depende de
 * JavaScript para enviar, e cada linha tem o próprio estado pendente.
 */
export function AcaoDeStatus({
  pacienteId,
  statusAtual,
}: {
  pacienteId: string;
  statusAtual: PatientStatus;
}) {
  const [, acao, pendente] = useActionState<EstadoStatus | undefined, FormData>(
    alterarStatusDoPaciente,
    undefined,
  );

  const arquivado = statusAtual === "archived";

  return (
    <form action={acao}>
      <input type="hidden" name="id" value={pacienteId} />
      <input
        type="hidden"
        name="status"
        value={arquivado ? "active" : "archived"}
      />
      <button
        type="submit"
        disabled={pendente}
        className="rounded-sm text-body-sm font-semibold text-action-primary hover:underline disabled:opacity-50"
      >
        {arquivado ? "Reativar" : "Arquivar"}
      </button>
    </form>
  );
}
