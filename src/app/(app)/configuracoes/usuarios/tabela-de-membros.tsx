"use client";

import { CircleAlertIcon, CircleCheckIcon, PlusIcon } from "lucide-react";
import { useActionState, useState } from "react";

import {
  AlertBanner,
  Badge,
  Button,
  Card,
  CardTitle,
  Input,
  Modal,
  Select,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui";
import { ROTULO_PAPEL } from "@/domain/auth/membros";
import { ROLES, type Role } from "@/domain/auth/types";

import {
  alterarPapel,
  convidarMembro,
  type EstadoMembros,
  revogarConvite,
} from "./actions";
import type { ConvitePendente, Membro } from "./page";

/**
 * Membros da Clínica (6:5096).
 *
 * Colunas medidas em 6:5105: Nome 220 · Email 220 · Papel 120 · Status 100 ·
 * Ações flex.
 *
 * A coluna Email fica vazia para membros já ativos: `auth.users.email` não é
 * legível pelo cliente sob RLS, e espelhar e-mail em `profiles` duplicaria
 * dado pessoal em duas tabelas. Convite pendente mostra o e-mail porque ele
 * vive em `invitations`. Ver docs/DESIGN_DECISIONS.md #29.
 */

const OPCOES_DE_PAPEL = ROLES.map((papel) => ({
  value: papel,
  label: ROTULO_PAPEL[papel],
}));

export function TabelaDeMembros({
  membros,
  pendentes,
  idDoViewer,
}: {
  membros: Membro[];
  pendentes: ConvitePendente[];
  idDoViewer: string;
}) {
  const [estadoConvite, acaoConvite, convidando] = useActionState<
    EstadoMembros | undefined,
    FormData
  >(convidarMembro, undefined);

  const [estadoPapel, acaoPapel, alterando] = useActionState<
    EstadoMembros | undefined,
    FormData
  >(alterarPapel, undefined);

  const [estadoRevogar, acaoRevogar] = useActionState<
    EstadoMembros | undefined,
    FormData
  >(revogarConvite, undefined);

  const [conviteAberto, setConviteAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Membro | null>(null);

  const erro = estadoConvite?.erro ?? estadoPapel?.erro ?? estadoRevogar?.erro;
  const aviso =
    estadoConvite?.aviso ?? estadoPapel?.aviso ?? estadoRevogar?.aviso;

  return (
    <Card variant="outlined" className="gap-5 rounded-[20px] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-display text-h3 font-bold">
            Membros da Clínica
          </CardTitle>
          <p className="text-body-sm text-text-secondary">
            Gerencie e visualize quem tem permissão para acessar os prontuários
            e agendas.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setConviteAberto(true)}
        >
          <PlusIcon size={14} aria-hidden />
          Convidar Usuário
        </Button>
      </div>

      {erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível concluir"
          description={erro}
        />
      )}
      {aviso && !erro && (
        <AlertBanner
          icon={CircleCheckIcon}
          tone="info"
          title="Pronto"
          description={aviso}
        />
      )}

      {/*
        O link é a ÚNICA cópia do token em claro — o banco só tem o SHA-256.
        Enquanto não há provedor de e-mail, ele precisa ficar visível e copiável
        aqui; fechar a tela sem copiar torna o convite inalcançável, e aí só
        resta revogar e refazer. O aviso diz isso, em vez de deixar a pessoa
        descobrir depois. Ver docs/DESIGN_DECISIONS.md #27.
      */}
      {estadoConvite?.linkDeConvite && (
        <div className="flex flex-col gap-2 rounded-xl border border-status-warning bg-status-warning-bg p-4">
          <p className="text-body-sm font-semibold text-status-warning-text">
            Copie o link agora — ele não é exibido de novo
          </p>
          <p className="text-caption text-text-secondary">
            Ainda não há envio automático de e-mail. Repasse este link para a
            pessoa convidada.
          </p>
          <input
            readOnly
            value={estadoConvite.linkDeConvite}
            aria-label="Link do convite"
            onFocus={(evento) => evento.currentTarget.select()}
            className="w-full rounded-md border border-border-default bg-background-primary px-3 py-2 font-mono text-caption text-text-primary"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border-default">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-[220px]">Nome</TableHeaderCell>
              <TableHeaderCell className="w-[220px]">Email</TableHeaderCell>
              <TableHeaderCell className="w-[120px]">Papel</TableHeaderCell>
              <TableHeaderCell className="w-[100px]">Status</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {membros.map((membro) => (
              <TableRow key={membro.id}>
                <TableCell className="font-semibold text-text-primary">
                  {membro.nome}
                </TableCell>
                <TableCell className="text-text-muted">—</TableCell>
                <TableCell>{ROTULO_PAPEL[membro.papel]}</TableCell>
                <TableCell>
                  <Badge variant={membro.arquivado ? "neutral" : "success"}>
                    {membro.arquivado ? "Arquivado" : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {membro.id === idDoViewer ? (
                    // O admin não altera o próprio papel — a policy
                    // profiles_update_admin bloqueia no banco.
                    <span
                      className="text-body-sm text-text-muted"
                      title="Peça a outro administrador. A separação é proposital."
                    >
                      Seu próprio acesso
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEmEdicao(membro)}
                      className="rounded-sm text-body-sm font-semibold text-action-primary hover:underline"
                    >
                      Editar permissões
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {pendentes.map((convite) => (
              <TableRow key={convite.id}>
                <TableCell className="font-semibold text-text-muted">
                  Convite Pendente
                </TableCell>
                <TableCell>{convite.email}</TableCell>
                <TableCell className="text-text-muted">
                  {ROTULO_PAPEL[convite.papel]}
                </TableCell>
                <TableCell>
                  <Badge variant="warning">Pendente</Badge>
                </TableCell>
                <TableCell>
                  <form action={acaoRevogar}>
                    <input type="hidden" name="id" value={convite.id} />
                    <button
                      type="submit"
                      className="rounded-sm text-body-sm font-semibold text-text-muted hover:underline"
                    >
                      Cancelar convite
                    </button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal
        open={conviteAberto}
        onClose={() => setConviteAberto(false)}
        title="Convidar usuário"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConviteAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-convite"
              variant="primary"
              size="md"
              loading={convidando}
            >
              Enviar convite
            </Button>
          </>
        }
      >
        <form
          id="form-convite"
          action={acaoConvite}
          className="flex flex-col gap-4"
        >
          <Input
            label="E-mail"
            name="email"
            type="email"
            required
            placeholder="nome@clinica.com"
          />
          <Select
            label="Papel"
            name="papel"
            required
            options={OPCOES_DE_PAPEL}
            defaultValue="psychologist"
          />
        </form>
      </Modal>

      <Modal
        open={emEdicao !== null}
        onClose={() => setEmEdicao(null)}
        title={`Permissões de ${emEdicao?.nome ?? ""}`}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setEmEdicao(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-papel"
              variant="primary"
              size="md"
              loading={alterando}
            >
              Salvar
            </Button>
          </>
        }
      >
        {/*
          `key` força remontar ao trocar de membro: o <dialog> fica sempre no
          DOM, então sem isso o `defaultValue` do Select ficaria preso no papel
          do primeiro membro aberto.
        */}
        <form
          key={emEdicao?.id ?? "vazio"}
          id="form-papel"
          action={acaoPapel}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={emEdicao?.id ?? ""} />
          <Select
            label="Papel"
            name="papel"
            required
            options={OPCOES_DE_PAPEL}
            defaultValue={emEdicao?.papel ?? ("psychologist" satisfies Role)}
          />
        </form>
      </Modal>
    </Card>
  );
}
