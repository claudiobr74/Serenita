"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useActionState } from "react";

import { AlertBanner, Button, Input } from "@/components/ui";

import { type EstadoPerfil, salvarPerfil } from "./actions";

export function PerfilForm({
  nome,
  telefone,
  crp,
  especializacoes,
  clinico,
}: {
  nome: string;
  telefone: string | null;
  crp: string | null;
  especializacoes: readonly string[];
  clinico: boolean;
}) {
  const [estado, acao, salvando] = useActionState<
    EstadoPerfil | undefined,
    FormData
  >(salvarPerfil, undefined);

  return (
    <div className="flex flex-col gap-5">
      {estado?.erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível salvar"
          description={estado.erro}
        />
      )}
      {estado?.aviso && !estado.erro && (
        <AlertBanner
          icon={CircleCheckIcon}
          tone="info"
          title="Pronto"
          description={estado.aviso}
        />
      )}

      <form action={acao} className="flex max-w-[640px] flex-col gap-5">
        <Input
          label="Nome completo"
          name="nome"
          required
          defaultValue={nome}
          autoComplete="name"
          error={estado?.erros?.nome}
        />

        <Input
          label="Telefone"
          name="telefone"
          type="tel"
          defaultValue={telefone ?? ""}
          autoComplete="tel"
          placeholder="(11) 99999-0000"
        />

        {/*
          CRP e especializações só existem para quem atende. Para admin e
          secretária os campos não são renderizados, e a action os zera — dado
          sem significado apareceria como real em telas futuras.
        */}
        {clinico && (
          <>
            <Input
              label="CRP"
              name="crp"
              defaultValue={crp ?? ""}
              placeholder="06/123456"
              hint="Registro no Conselho Regional de Psicologia."
              error={estado?.erros?.crp}
            />

            <Input
              label="Especializações"
              name="especializacoes"
              defaultValue={especializacoes.join(", ")}
              placeholder="Terapia Cognitivo-Comportamental, Casal e Família"
              hint="Separe por vírgula."
            />
          </>
        )}

        <div className="pt-2">
          <Button type="submit" variant="primary" size="cta" loading={salvando}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
