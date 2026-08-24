import type { Metadata } from "next";
import Link from "next/link";
import { GlobeIcon, HomeIcon, UsersIcon } from "lucide-react";

import {
  Badge,
  Card,
  EmptyState,
  initialsOf,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { canAccessClinicalContent } from "@/domain/auth/policy";
import { ocultarCpf } from "@/domain/paciente/cpf";
import {
  ehFiltroValido,
  ROTULO_MODALIDADE,
  ROTULO_STATUS_SINGULAR,
} from "@/domain/paciente/types";
import { cn } from "@/lib/cn";
import { requireViewer } from "@/server/auth/session";

import { AcaoDeStatus } from "./acao-status";
import { buscarPacientes } from "./consulta";
import { Filtros } from "./filtros";

/**
 * `/pacientes` — frame `lista-pacientes` (6:496).
 *
 * Colunas do frame (6:588–6:594): Nome & Registro · Status · Modalidade ·
 * Última Sessão · Próxima Sessão · Pendências Clínicas · Ações.
 *
 * **Três dessas colunas não são renderizadas aqui**, e a razão é diferente
 * para cada grupo — ver docs/DESIGN_DECISIONS.md #37.
 */

export const metadata: Metadata = {
  title: "Pacientes — Serenità",
};

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const viewer = await requireViewer();

  const filtro = status && ehFiltroValido(status) ? status : "todos";
  const termo = q ?? "";

  const pacientes = await buscarPacientes({ filtro, termo });

  // Quem não tem acesso clínico não vê nem a coluna vazia: exibir "Pendências
  // Clínicas" para um admin sugeriria que o dado existe e está sendo omitido,
  // quando na verdade ele nunca será mostrado a esse papel.
  const mostrarClinico = canAccessClinicalContent(viewer.profile.role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Filtros filtroAtual={filtro} termoAtual={termo} />
        </div>
        <BotaoNovoPaciente />
      </div>

      {pacientes.length === 0 ? (
        <Card variant="outlined" className="rounded-[20px] p-0">
          <EmptyState
            icon={UsersIcon}
            title={
              termo || filtro !== "todos"
                ? "Nenhum paciente encontrado"
                : "Nenhum paciente cadastrado"
            }
            description={
              termo || filtro !== "todos"
                ? "Ajuste a busca ou o filtro para ver outros resultados."
                : "Cadastre o primeiro paciente para começar."
            }
            action={<BotaoNovoPaciente />}
          />
        </Card>
      ) : (
        <Card
          variant="outlined"
          className="gap-0 overflow-hidden rounded-[20px] p-0"
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell className="w-[260px]">
                  Nome &amp; Registro
                </TableHeaderCell>
                <TableHeaderCell className="w-[120px]">Status</TableHeaderCell>
                <TableHeaderCell className="w-[160px]">
                  Modalidade
                </TableHeaderCell>
                <TableHeaderCell className="w-[160px]">CPF</TableHeaderCell>
                {mostrarClinico && (
                  <TableHeaderCell className="w-[180px]">
                    Pendências Clínicas
                  </TableHeaderCell>
                )}
                <TableHeaderCell>Ações</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-hover text-caption font-semibold text-action-primary"
                      >
                        {initialsOf(paciente.fullName)}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-semibold text-text-primary">
                          {paciente.fullName}
                        </span>
                        <span className="font-mono text-caption text-text-secondary">
                          {paciente.displayCode}
                        </span>
                      </span>
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        paciente.status === "active" ? "success" : "neutral"
                      }
                    >
                      {ROTULO_STATUS_SINGULAR[paciente.status]}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {paciente.modality ? (
                      <span className="flex items-center gap-2">
                        {paciente.modality === "online" ? (
                          <GlobeIcon size={14} aria-hidden />
                        ) : (
                          <HomeIcon size={14} aria-hidden />
                        )}
                        {ROTULO_MODALIDADE[paciente.modality]}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>

                  {/* `03 — PATTERNS` exige CPF mascarado na tela. */}
                  <TableCell className="font-mono text-text-secondary">
                    {ocultarCpf(paciente.cpf)}
                  </TableCell>

                  {mostrarClinico && (
                    <TableCell className="text-text-muted">
                      {/* Pendências clínicas chegam com as sessões, na Fase 6. */}
                      Nenhuma
                    </TableCell>
                  )}

                  <TableCell>
                    <AcaoDeStatus
                      pacienteId={paciente.id}
                      statusAtual={paciente.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}

/**
 * "Novo paciente" (6:582) — px 18 · py 10 · radius 8 · ícone users 16.
 *
 * É um `Link` com a aparência do botão primário, e não um `Button`: navegação
 * precisa ser âncora para funcionar com clique do meio, abrir em nova aba e
 * leitor de tela. O `Button` do design system não tem `asChild`.
 * Ver docs/DESIGN_DECISIONS.md #38.
 */
function BotaoNovoPaciente() {
  return (
    <Link
      href="/pacientes/novo"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md px-[18px] py-2.5",
        "bg-action-primary text-body font-semibold text-text-inverse shadow-sm",
        "duration-fast transition-colors ease-standard hover:bg-action-primary-hover",
      )}
    >
      <UsersIcon size={16} aria-hidden />
      Novo paciente
    </Link>
  );
}
