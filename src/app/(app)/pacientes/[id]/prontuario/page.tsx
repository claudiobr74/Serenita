import { LockIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui";
import { canAccessClinicalContent } from "@/domain/auth/policy";
import {
  ABERTA_POR_PADRAO,
  SECOES_DO_PRONTUARIO,
} from "@/domain/prontuario/secoes";
import { requireViewer } from "@/server/auth/session";

import { carregarPaciente, carregarProntuario } from "../carregar";
import { SecaoDoProntuarioCard } from "./secao";

/**
 * Aba "Prontuário" — frame `prontuario` (6:1658).
 *
 * Quatro seções colapsáveis, com autosave. Quem chega aqui sem ser o psicólogo
 * designado vê a razão, não uma tela vazia: a RLS devolveria zero linhas e o
 * prontuário pareceria em branco, sugerindo que não há registro quando o que
 * há é falta de acesso. Dizer "restrito ao psicólogo designado" não vaza nada
 * — quem está nesta rota já sabe que o paciente existe, porque o banner do
 * layout carregou.
 */

export const metadata: Metadata = {
  title: "Prontuário — Serenità",
};

export default async function ProntuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const paciente = await carregarPaciente(id);
  if (!paciente) notFound();

  const designado = paciente.assignedPsychologistId === viewer.userId;
  const podeVer = canAccessClinicalContent(viewer.profile.role) && designado;

  if (!podeVer) {
    return (
      <EmptyState
        icon={LockIcon}
        title="Prontuário restrito"
        description="O prontuário é acessível apenas ao psicólogo designado para este paciente. Nem a administração da clínica o acessa."
      />
    );
  }

  const conteudo = await carregarProntuario(paciente.id);

  return (
    <div className="flex flex-col gap-4">
      {SECOES_DO_PRONTUARIO.map((secao) => (
        <SecaoDoProntuarioCard
          key={secao}
          pacienteId={paciente.id}
          secao={secao}
          conteudoInicial={conteudo[secao]}
          // O frame abre as duas primeiras. Seção já preenchida também abre:
          // esconder o que já foi escrito seria pior do que divergir do estado
          // inicial do desenho.
          abertaInicialmente={
            ABERTA_POR_PADRAO.has(secao) || conteudo[secao].length > 0
          }
        />
      ))}
    </div>
  );
}
