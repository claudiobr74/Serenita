"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useCallback, useId, useState } from "react";

import {
  EXEMPLO_SECAO,
  LIMITE_DA_SECAO,
  ROTULO_SECAO,
  type SecaoDoProntuario,
} from "@/domain/prontuario/secoes";
import { useAutosave } from "@/lib/autosave";

import { salvarSecaoDoProntuario } from "./actions";

/**
 * Um cartão de seção do prontuário — frame 6:1759.
 *
 * Spec medida: bg background-primary · border 1px border-default · radius 16 ·
 * p 24 · gap 16; título 18 Newsreader Bold; corpo 14 com line-height 1.6;
 * chevron de 16 dentro de caixa de 18, encostado na borda direita.
 *
 * O frame mostra o prontuário só em leitura. Aqui o corpo é o próprio campo de
 * escrita: com autosave, um botão "Editar" seria um passo sem função — ver
 * docs/DESIGN_DECISIONS.md #46.
 */
export function SecaoDoProntuarioCard({
  pacienteId,
  secao,
  conteudoInicial,
  abertaInicialmente,
}: {
  pacienteId: string;
  secao: SecaoDoProntuario;
  conteudoInicial: string;
  abertaInicialmente: boolean;
}) {
  const [aberta, setAberta] = useState(abertaInicialmente);
  const [texto, setTexto] = useState(conteudoInicial);
  const corpoId = useId();

  // `useAutosave` exige identidade estável: sem isto o timer do debounce
  // seria reagendado a cada tecla e nunca fecharia.
  const salvar = useCallback(
    (valor: string) => salvarSecaoDoProntuario(pacienteId, secao, valor),
    [pacienteId, secao],
  );

  const autosave = useAutosave({
    valor: texto,
    valorInicial: conteudoInicial,
    salvar,
  });

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-default bg-background-primary p-6">
      <button
        type="button"
        onClick={() => setAberta((atual) => !atual)}
        aria-expanded={aberta}
        aria-controls={corpoId}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <h2 className="font-display text-h3 font-bold text-text-primary">
          {ROTULO_SECAO[secao]}
        </h2>

        <span className="flex size-[18px] shrink-0 items-center justify-center text-text-secondary">
          {aberta ? (
            <ChevronUpIcon size={16} strokeWidth={1.75} aria-hidden />
          ) : (
            <ChevronDownIcon size={16} strokeWidth={1.75} aria-hidden />
          )}
        </span>
      </button>

      {aberta && (
        <div id={corpoId} className="flex flex-col gap-2">
          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onBlur={autosave.salvarAgora}
            maxLength={LIMITE_DA_SECAO}
            aria-label={ROTULO_SECAO[secao]}
            placeholder={EXEMPLO_SECAO[secao]}
            // Uma linha de mínimo, e `field-sizing-content` cresce a partir
            // dela. No frame, a seção preenchida tem exatamente uma linha de
            // corpo — um mínimo maior deixaria o cartão alto e vazio.
            rows={1}
            className={[
              // `field-sizing-content` faz o campo crescer com o texto, de
              // modo que a seção continue parecendo documento e não
              // formulário. Onde o browser não suporta, vira um textarea
              // comum com rolagem — degrada, não quebra.
              "field-sizing-content w-full resize-none",
              "text-body leading-[1.6] text-text-secondary",
              "placeholder:text-text-muted",
              "rounded-md border border-transparent bg-transparent p-0",
            ].join(" ")}
          />
          <EstadoDaGravacao
            situacao={autosave.situacao}
            salvoEm={autosave.salvoEm}
          />
        </div>
      )}
    </section>
  );
}

/**
 * `03 — PATTERNS / Autosave`: "Salvando · Salvo · Erro ao salvar", com
 * timestamp — e anunciado para leitores de tela (docs/ARCHITECTURE.md §15).
 *
 * `role="status"` com `aria-live="polite"` porque a mudança nunca deve
 * interromper quem está digitando.
 */
function EstadoDaGravacao({
  situacao,
  salvoEm,
}: {
  situacao: "limpo" | "pendente" | "salvando" | "erro";
  salvoEm: Date | null;
}) {
  const texto =
    situacao === "salvando"
      ? "Salvando…"
      : situacao === "erro"
        ? "Erro ao salvar. O texto continua nesta tela."
        : situacao === "pendente"
          ? "Alterações não salvas"
          : salvoEm
            ? `Salvo às ${formatarHora(salvoEm)}`
            : "";

  return (
    <p
      role="status"
      aria-live="polite"
      className={
        situacao === "erro"
          ? "text-caption text-status-error-text"
          : "text-caption text-text-muted"
      }
    >
      {texto}
    </p>
  );
}

function formatarHora(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}
