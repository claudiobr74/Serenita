import { NotebookPenIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardTitle, EmptyState } from "@/components/ui";
import { canAccessClinicalContent } from "@/domain/auth/policy";
import { ocultarCpf } from "@/domain/paciente/cpf";
import { requireViewer } from "@/server/auth/session";

import { ROTULO_SECAO } from "@/domain/prontuario/secoes";

import {
  carregarAcolhimento,
  carregarPaciente,
  carregarProntuario,
} from "./carregar";

/**
 * Aba "Resumo" — frame `TabGrid` (6:885).
 *
 * O frame mostra: Objetivos Terapêuticos com barras de progresso, Última
 * Evolução Clínica, contadores de sessão, Próxima Sessão e Pendências do
 * Paciente.
 *
 * **Tudo isso é clínico ou depende de sessões.** Renderizar essa tela para um
 * admin seria contradizer a RBAC Matrix; renderizá-la vazia sugeriria que há
 * algo sendo escondido. Então a aba mostra conteúdos diferentes por papel:
 * quem tem acesso clínico vê o clínico, quem não tem vê o cadastro — que é o
 * que legitimamente precisa. Ver docs/DESIGN_DECISIONS.md #42.
 */

export const metadata: Metadata = {
  title: "Paciente — Serenità",
};

export default async function ResumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const paciente = await carregarPaciente(id);
  if (!paciente) notFound();

  const clinico = canAccessClinicalContent(viewer.profile.role);

  return (
    <div className="grid gap-6 desktop:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        {clinico ? (
          <AcolhimentoClinico pacienteId={paciente.id} />
        ) : (
          <CadastroResumido paciente={paciente} />
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Consentimentos
          tcle={paciente.tcleAcceptedAt}
          ia={paciente.aiConsentAt}
        />

        {/*
          Contadores de sessão, próxima sessão e pendências (6:914, 6:921,
          6:929) dependem de sessões e agenda, que chegam nas Fases 5 e 6.
        */}
        {clinico && (
          <Card variant="outlined" className="gap-2 rounded-[20px] p-6">
            <CardTitle className="font-display text-h4 font-bold">
              Sessões e pendências
            </CardTitle>
            <p className="text-body-sm text-text-secondary">
              Contadores, próxima sessão e pendências clínicas chegam com a
              Agenda (Fase 5) e o Modo Sessão (Fase 6).
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * O conteúdo clínico que o Resumo mostra: os parâmetros do acolhimento e a
 * demanda inicial, que é uma seção do prontuário.
 *
 * A demanda mora em `patient_clinical_record` desde a migration 20260824235613
 * — aqui é leitura, e o lugar de escrevê-la é a aba Prontuário. Duas telas
 * editáveis para o mesmo texto seria convite a sobrescrita silenciosa.
 *
 * Não há checagem de papel nas consultas: a RLS das duas tabelas exige
 * `is_clinical_role()` e a designação. Se este componente for renderizado para
 * quem não deve, ele simplesmente não recebe dado.
 */
async function AcolhimentoClinico({ pacienteId }: { pacienteId: string }) {
  const [acolhimento, prontuario] = await Promise.all([
    carregarAcolhimento(pacienteId),
    carregarProntuario(pacienteId),
  ]);

  const demanda = prontuario.initial_complaint;

  if (!acolhimento && !demanda) {
    return (
      <EmptyState
        icon={NotebookPenIcon}
        title="Sem acolhimento registrado"
        description="Objetivos terapêuticos e evolução clínica chegam com o Plano Terapêutico e o Modo Sessão."
      />
    );
  }

  return (
    <>
      <Card variant="outlined" className="gap-4 rounded-[20px] p-6">
        <CardTitle className="font-display text-h4 font-bold">
          Acolhimento inicial
        </CardTitle>

        <dl className="grid gap-4 desktop:grid-cols-2">
          <Campo
            termo="Abordagem terapêutica"
            valor={acolhimento?.therapeutic_approach ?? null}
          />
          <Campo
            termo="Frequência sugerida"
            valor={acolhimento?.suggested_frequency ?? null}
          />
        </dl>

        {demanda && (
          <div className="flex flex-col gap-2">
            <p className="text-caption font-semibold text-text-muted uppercase">
              {ROTULO_SECAO.initial_complaint}
            </p>
            <p className="text-body whitespace-pre-wrap text-text-primary">
              {demanda}
            </p>
          </div>
        )}
      </Card>

      <Card variant="outlined" className="gap-2 rounded-[20px] p-6">
        <CardTitle className="font-display text-h4 font-bold">
          Objetivos terapêuticos e evolução
        </CardTitle>
        <p className="text-body-sm text-text-secondary">
          Os objetivos com progresso (6:887) e a última evolução clínica (6:908)
          vêm do Plano Terapêutico e das sessões — Fases 4 e 6.
        </p>
      </Card>
    </>
  );
}

/**
 * O que admin e secretária veem no lugar do clínico.
 *
 * É o cadastro que eles legitimamente operam: contato, documento, profissão.
 * CPF mascarado, como `03 — PATTERNS` exige.
 */
function CadastroResumido({
  paciente,
}: {
  paciente: {
    cpf: string | null;
    phone: string | null;
    email: string | null;
    occupation: string | null;
  };
}) {
  return (
    <Card variant="outlined" className="gap-4 rounded-[20px] p-6">
      <CardTitle className="font-display text-h4 font-bold">
        Dados cadastrais
      </CardTitle>

      <dl className="grid gap-4 desktop:grid-cols-2">
        <Campo termo="CPF" valor={ocultarCpf(paciente.cpf)} mono />
        <Campo termo="Telefone" valor={paciente.phone} />
        <Campo termo="E-mail" valor={paciente.email} />
        <Campo termo="Profissão" valor={paciente.occupation} />
      </dl>

      <p className="text-caption text-text-muted">
        O conteúdo clínico deste paciente não é acessível ao seu nível de
        acesso.
      </p>
    </Card>
  );
}

function Consentimentos({
  tcle,
  ia,
}: {
  tcle: string | null;
  ia: string | null;
}) {
  return (
    <Card variant="outlined" className="gap-3 rounded-[20px] p-6">
      <CardTitle className="font-display text-h4 font-bold">
        Consentimentos
      </CardTitle>

      <ItemDeConsentimento
        rotulo="Termo de Consentimento Livre e Esclarecido"
        em={tcle}
      />
      <ItemDeConsentimento rotulo="Processamento por IA" em={ia} />

      <p className="text-caption text-text-muted">
        O fluxo completo, com versão assinada preservada, chega na Fase 9.
      </p>
    </Card>
  );
}

function ItemDeConsentimento({
  rotulo,
  em,
}: {
  rotulo: string;
  em: string | null;
}) {
  const concedido = em !== null;

  return (
    <div className="flex items-start gap-3">
      {concedido ? (
        <span
          aria-hidden
          className="mt-1 size-2 shrink-0 rounded-full bg-status-success"
        />
      ) : (
        <TriangleAlertIcon
          size={14}
          aria-hidden
          className="mt-0.5 shrink-0 text-status-warning-text"
        />
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-body text-text-primary">{rotulo}</span>
        {/*
          O indicador não depende só de cor: há ícone diferente e texto
          explícito, por exigência de acessibilidade do `10 — DEV HANDOFF`.
        */}
        <span className="text-caption text-text-secondary">
          {concedido ? `Concedido em ${formatarData(em)}` : "Não concedido"}
        </span>
      </div>
    </div>
  );
}

function Campo({
  termo,
  valor,
  mono = false,
}: {
  termo: string;
  valor: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption font-semibold text-text-muted uppercase">
        {termo}
      </dt>
      <dd
        className={
          mono
            ? "font-mono text-body text-text-primary"
            : "text-body text-text-primary"
        }
      >
        {valor ?? "—"}
      </dd>
    </div>
  );
}

function formatarData(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(data);
}
