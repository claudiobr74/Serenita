"use client";

import { CircleAlertIcon } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";

import {
  AlertBanner,
  Button,
  Checkbox,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { mascararCpf } from "@/domain/paciente/cpf";
import { CARE_MODALITY, ROTULO_MODALIDADE } from "@/domain/paciente/types";

import { cadastrarPaciente, type EstadoCadastro } from "./actions";

/**
 * Formulário de cadastro — frame 6:5370.
 *
 * Spec medida: card p 32 · gap 32 · radius 20; seção gap 20 com título
 * Newsreader Bold 20 seguido de régua; grade de campos em duas colunas
 * (`03 — PATTERNS`: duas colunas para entrada densa); ações à direita, gap 12,
 * Cancelar 120px e Salvar 180px.
 */

const CAMPO = "bg-background-secondary";

const OPCOES_MODALIDADE = CARE_MODALITY.map((valor) => ({
  value: valor,
  label: ROTULO_MODALIDADE[valor],
}));

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-h3 font-bold whitespace-nowrap text-text-primary">
          {titulo}
        </h2>
        <hr className="min-w-0 flex-1 border-border-default" />
      </div>
      {children}
    </section>
  );
}

export function FormularioDePaciente({ clinico }: { clinico: boolean }) {
  const [estado, acao, salvando] = useActionState<
    EstadoCadastro | undefined,
    FormData
  >(cadastrarPaciente, undefined);

  const [cpf, setCpf] = useState("");

  return (
    <form action={acao} className="flex flex-col gap-8">
      {estado?.erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível cadastrar"
          description={estado.erro}
        />
      )}

      <Secao titulo="1. Dados Pessoais">
        <div className="grid gap-5 desktop:grid-cols-2">
          <div className="desktop:col-span-2">
            <Input
              label="Nome Completo"
              name="nome"
              required
              autoComplete="off"
              placeholder="Ex: Ana Beatriz Costa"
              className={CAMPO}
              error={estado?.erros?.nome}
            />
          </div>

          <Input
            label="Data de Nascimento"
            name="nascimento"
            type="date"
            required
            className={CAMPO}
            error={estado?.erros?.nascimento}
          />

          <Input
            label="CPF"
            name="cpf"
            required
            inputMode="numeric"
            value={cpf}
            onChange={(evento) => setCpf(evento.target.value)}
            onBlur={(evento) => setCpf(mascararCpf(evento.target.value))}
            placeholder="000.000.000-00"
            className={CAMPO}
            error={estado?.erros?.cpf}
          />

          <Input
            label="E-mail"
            name="email"
            type="email"
            placeholder="nome@email.com"
            className={CAMPO}
          />

          <Input
            label="Telefone"
            name="telefone"
            type="tel"
            required
            placeholder="(11) 99999-0000"
            className={CAMPO}
            error={estado?.erros?.telefone}
          />

          <Input
            label="Profissão"
            name="profissao"
            placeholder="Ex: Designer de Produto"
            className={CAMPO}
          />

          {/*
            Modalidade não está nesta tela do Figma, mas é coluna da lista
            (6:590) e não há outro lugar onde seja definida.
            Ver docs/DESIGN_DECISIONS.md #39.
          */}
          <Select
            label="Modalidade de atendimento"
            name="modalidade"
            options={OPCOES_MODALIDADE}
            defaultValue=""
            className={CAMPO}
          />
        </div>
      </Secao>

      {/*
        Seção 2 só existe para quem tem acesso clínico. Não é ocultar por
        estética: são queixas e sintomas, e a RLS de `patient_clinical_intake`
        recusaria a escrita de admin ou secretária de qualquer modo. Renderizar
        os campos os convidaria a digitar algo que seria descartado.
      */}
      {clinico && (
        <Secao titulo="2. Informações Clínicas">
          <div className="grid gap-5 desktop:grid-cols-2">
            <Input
              label="Abordagem Terapêutica"
              name="abordagem"
              placeholder="Ex: Terapia Cognitivo-Comportamental (TCC)"
              className={CAMPO}
            />
            <Input
              label="Frequência Sugerida"
              name="frequencia"
              placeholder="Ex: Semanal"
              className={CAMPO}
            />
            <div className="desktop:col-span-2">
              <Textarea
                label="Demanda Inicial"
                name="demanda"
                rows={4}
                placeholder="Descreva resumidamente as principais queixas, sintomas ou objetivos trazidos pelo paciente no contato inicial..."
                className={CAMPO}
              />
            </div>
          </div>
        </Secao>
      )}

      <Secao titulo="3. Termos & Consentimentos">
        <div className="flex flex-col gap-3">
          <Checkbox
            name="tcle"
            label="Paciente concorda com o Termo de Consentimento Livre e Esclarecido (TCLE) de atendimento clínico."
          />
          <Checkbox
            name="consentimentoIa"
            label="Consentimento para utilização do Supervisor IA Serenitá para processamento de insights e resumos protegidos."
          />
        </div>
      </Secao>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="reset" variant="outline" size="cta" className="w-[120px]">
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="cta"
          className="w-[180px]"
          loading={salvando}
        >
          Salvar Paciente
        </Button>
      </div>
    </form>
  );
}
