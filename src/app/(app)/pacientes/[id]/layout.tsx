import { CalendarIcon, CogIcon } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge, initialsOf, TabLinks } from "@/components/ui";
import {
  ROTULO_MODALIDADE,
  ROTULO_STATUS_SINGULAR,
} from "@/domain/paciente/types";
import { requireViewer } from "@/server/auth/session";

import { carregarPaciente } from "./carregar";
import { tabsVisiveisPara } from "./tabs";

/**
 * Perfil do paciente — banner (6:843) e tabs (6:869).
 *
 * Spec medida do banner: bg background-primary · border-b · p 32; avatar 64
 * rounded-full em status-warning-bg com iniciais 24 Newsreader Bold em
 * status-warning; nome 28 Newsreader Bold; código em JetBrains Mono 14; badge
 * uppercase 12; linha de meta 13px separada por pontos de 4px.
 *
 * O banner só carrega **dado cadastral**, que a RLS de `patients` já libera
 * para os três papéis. Nada clínico aparece aqui.
 */
export default async function PacienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const paciente = await carregarPaciente(id);

  // `null` cobre inexistente E invisível sob RLS, de propósito: distinguir
  // confirmaria a existência do paciente a quem não pode vê-lo.
  if (!paciente) notFound();

  const idade = calcularIdade(paciente.birthDate);
  const inicio = formatarMesEAno(paciente.createdAt);

  return (
    // `-m-8` desfaz o padding do AppShell: o banner encosta nas bordas, como
    // no frame, e o conteúdo recupera o respiro logo abaixo.
    <div className="-m-8 flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-border-default bg-background-primary p-8">
        <div className="flex items-center gap-5">
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full bg-status-warning-bg font-display text-h3 font-bold text-status-warning-text"
          >
            {initialsOf(paciente.fullName)}
          </span>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-h1 font-bold text-text-primary">
                {paciente.fullName}
              </h1>
              <span className="font-mono text-body text-text-secondary">
                {paciente.displayCode}
              </span>
              <Badge
                variant={paciente.status === "active" ? "success" : "neutral"}
              >
                {ROTULO_STATUS_SINGULAR[paciente.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-body-sm text-text-secondary">
              <span>Início: {inicio}</span>
              <Ponto />
              <span>
                Modalidade:{" "}
                {paciente.modality
                  ? ROTULO_MODALIDADE[paciente.modality]
                  : "não definida"}
              </span>
              {idade !== null && (
                <>
                  <Ponto />
                  <span>Idade: {idade} anos</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/*
          As duas ações do frame ainda não têm destino: editar dados é a fatia
          seguinte, e agendar depende da agenda (Fase 5). Ficam desabilitadas
          com o motivo, em vez de omitidas ou levando a lugar nenhum — mesma
          escolha do botão do Google (#20) e das seções de Configurações (#28).
        */}
        <div className="flex flex-wrap items-center gap-3">
          <AcaoPendente
            icone={<CogIcon size={16} aria-hidden />}
            rotulo="Editar Dados"
            motivo="A edição de cadastro chega na próxima fatia da Fase 4."
          />
          <AcaoPendente
            icone={<CalendarIcon size={16} aria-hidden />}
            rotulo="Agendar Sessão"
            motivo="O agendamento chega com a Agenda, na Fase 5."
            primaria
          />
        </div>
      </header>

      <div className="flex flex-col gap-6 p-8">
        <TabLinks
          items={tabsVisiveisPara(viewer.profile.role, paciente.id)}
          currentPath={`/pacientes/${paciente.id}`}
          label="Seções do paciente"
        />
        {children}
      </div>
    </div>
  );
}

function Ponto() {
  return <span aria-hidden className="size-1 rounded-full bg-text-muted" />;
}

function AcaoPendente({
  icone,
  rotulo,
  motivo,
  primaria = false,
}: {
  icone: React.ReactNode;
  rotulo: string;
  motivo: string;
  primaria?: boolean;
}) {
  return (
    <button
      type="button"
      disabled
      title={motivo}
      className={
        primaria
          ? "inline-flex cursor-not-allowed items-center gap-2 rounded-md bg-action-primary px-[18px] py-2.5 text-body font-semibold text-text-inverse opacity-40"
          : "inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border-default bg-background-primary px-4 py-2.5 text-body font-semibold text-text-primary opacity-40"
      }
    >
      {icone}
      {rotulo}
    </button>
  );
}

/** Idade em anos completos. `null` quando não há data de nascimento. */
function calcularIdade(nascimento: string | null): number | null {
  if (!nascimento) return null;

  const data = new Date(nascimento);
  if (Number.isNaN(data.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getUTCFullYear() - data.getUTCFullYear();

  // Ainda não fez aniversário este ano.
  const mes = hoje.getUTCMonth() - data.getUTCMonth();
  if (mes < 0 || (mes === 0 && hoje.getUTCDate() < data.getUTCDate())) {
    idade -= 1;
  }

  return idade >= 0 ? idade : null;
}

/** "Março 2025", como no frame (6:854). */
function formatarMesEAno(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";

  const texto = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(data);

  // `pt-BR` devolve "março de 2025"; o frame não tem o "de".
  return texto.replace(" de ", " ").replace(/^./, (c) => c.toUpperCase());
}
