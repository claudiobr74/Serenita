"use client";

import { CircleAlertIcon } from "lucide-react";
import { useActionState, useState } from "react";

import { AlertBanner, Button, Input } from "@/components/ui";
import { mascararCnpj } from "@/domain/clinic/cnpj";
import {
  CLINIC_KINDS,
  type ClinicKind,
  ROTULO_TIPO,
} from "@/domain/clinic/types";
import { cn } from "@/lib/cn";

import {
  type EstadoOnboarding,
  pularOnboarding,
  salvarDadosDaClinica,
} from "./actions";

/**
 * Formulário do passo 1 (6:5226).
 *
 * Spec medida: form gap 20 · campo gap 8 · label 13 SemiBold · caixa p 12
 * radius 8 bg background-secondary · seletor de tipo em dois cartões de largura
 * igual, gap 12 · ações gap 16 pt 8.
 */

const CAMPO_NO_CARD = "bg-background-secondary";

export function OnboardingForm({
  nomeInicial,
  cnpjInicial,
  enderecoInicial,
  telefoneInicial,
  tipoInicial,
}: {
  nomeInicial: string;
  cnpjInicial: string | null;
  enderecoInicial: string | null;
  telefoneInicial: string | null;
  tipoInicial: ClinicKind | null;
}) {
  const [estado, acao, enviando] = useActionState<
    EstadoOnboarding | undefined,
    FormData
  >(salvarDadosDaClinica, undefined);

  const [tipo, setTipo] = useState<ClinicKind | null>(tipoInicial);
  const [cnpj, setCnpj] = useState(
    cnpjInicial ? mascararCnpj(cnpjInicial) : "",
  );

  return (
    <div className="flex w-full flex-col gap-5">
      {estado?.erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível continuar"
          description={estado.erro}
        />
      )}

      <form action={acao} className="flex w-full flex-col gap-5">
        <Input
          label="Nome do seu Espaço ou Clínica"
          name="nome"
          required
          defaultValue={nomeInicial}
          placeholder="Ex: Espaço Terapêutico Equilíbrio"
          className={CAMPO_NO_CARD}
          error={estado?.erros?.nome}
        />

        <Input
          label="CNPJ da Clínica (Opcional)"
          name="cnpj"
          inputMode="numeric"
          value={cnpj}
          onChange={(evento) => setCnpj(evento.target.value)}
          onBlur={(evento) => setCnpj(mascararCnpj(evento.target.value))}
          placeholder="00.000.000/0001-00"
          className={CAMPO_NO_CARD}
          error={estado?.erros?.cnpj}
        />

        <Input
          label="Endereço Comercial"
          name="endereco"
          defaultValue={enderecoInicial ?? ""}
          placeholder="Ex: Av. Paulista, 1000 - Sala 42"
          className={CAMPO_NO_CARD}
        />

        <Input
          label="Telefone de Atendimento"
          name="telefone"
          type="tel"
          defaultValue={telefoneInicial ?? ""}
          placeholder="(11) 99999-0000"
          className={CAMPO_NO_CARD}
          error={estado?.erros?.telefone}
        />

        {/*
          Tipo de Atuação (6:5250) — dois cartões de largura igual. São radio
          por baixo: seleção única, navegável por teclado com as setas, e o
          formulário envia o valor sem depender de JavaScript.
        */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-sm font-medium text-text-primary">
            Tipo de Atuação
          </legend>
          <div className="flex gap-3">
            {CLINIC_KINDS.map((valor) => {
              const selecionado = tipo === valor;
              return (
                <label
                  key={valor}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center rounded-md border p-3",
                    "duration-fast text-body transition-colors ease-standard",
                    "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
                    "has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-action-primary",
                    selecionado
                      ? "border-action-primary bg-surface-hover font-semibold text-action-primary"
                      : "border-border-default bg-background-secondary text-text-secondary hover:bg-surface-hover",
                  )}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={valor}
                    checked={selecionado}
                    onChange={() => setTipo(valor)}
                    className="sr-only"
                  />
                  {ROTULO_TIPO[valor]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="cta"
            className="w-full"
            loading={enviando}
          >
            Continuar
          </Button>
        </div>
      </form>

      {/* "Pular por enquanto" (6:5258) — sublinhado, text-secondary. */}
      <form action={pularOnboarding}>
        <button
          type="submit"
          className="w-full rounded-sm text-center text-body text-text-secondary underline hover:text-text-primary"
        >
          Pular por enquanto
        </button>
      </form>
    </div>
  );
}
