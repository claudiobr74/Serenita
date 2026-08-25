"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Autosave — `03 — PATTERNS / Autosave` e docs/ARCHITECTURE.md §15.
 *
 * A spec pede duas coisas ao mesmo tempo: **debounce de 500ms** e **salvar a
 * cada 30s**. Elas se contradizem para quem digita sem parar — o debounce
 * nunca dispara. Então o 500ms é o piso e os 30s são o teto: um único timer,
 * agendado para o menor dos dois, onde o teto conta desde que o texto ficou
 * sujo e NÃO é reiniciado pelas teclas seguintes.
 *
 * Os estados são derivados, não guardados: `pendente` é simplesmente "o valor
 * atual difere do último que o servidor confirmou". Guardá-lo exigiria
 * `setState` dentro do efeito que observa o valor — que é o que a regra
 * `react-hooks/set-state-in-effect` do React 19 proíbe, e com razão.
 *
 * `salvar` PRECISA ter identidade estável (`useCallback` no chamador). Uma
 * função nova a cada render reagendaria o timer a cada render, e o debounce
 * nunca fecharia.
 */

export type SituacaoDoAutosave = "limpo" | "pendente" | "salvando" | "erro";

export type EstadoDoAutosave = {
  readonly situacao: SituacaoDoAutosave;
  /** Quando o servidor confirmou pela última vez. `null` até a primeira. */
  readonly salvoEm: Date | null;
  readonly erro: string | null;
  /** Força o envio agora — usado no blur e ao esconder a aba. */
  readonly salvarAgora: () => void;
};

export type ResultadoDoAutosave = { ok: true } | { ok: false; erro: string };

export function useAutosave({
  valor,
  valorInicial,
  salvar,
  debounceMs = 500,
  tetoMs = 30_000,
}: {
  valor: string;
  /** O que já está no servidor quando a tela monta. */
  valorInicial: string;
  salvar: (valor: string) => Promise<ResultadoDoAutosave>;
  debounceMs?: number;
  tetoMs?: number;
}): EstadoDoAutosave {
  const [confirmado, setConfirmado] = useState(valorInicial);
  const [salvando, setSalvando] = useState(false);
  const [salvoEm, setSalvoEm] = useState<Date | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Início do trecho sujo — a âncora do teto de 30s. Ref, e não estado: mudá-lo
  // não deve provocar render.
  const sujoDesde = useRef<number | null>(null);
  const emVoo = useRef(false);

  const enviar = useCallback(
    async (enviado: string) => {
      // Duas gravações concorrentes chegariam fora de ordem, e a mais antiga
      // poderia vencer. Se o texto seguir sujo, o efeito reagenda sozinho.
      if (emVoo.current) return;

      emVoo.current = true;
      setSalvando(true);

      const resultado = await salvar(enviado);

      emVoo.current = false;
      setSalvando(false);

      if (resultado.ok) {
        sujoDesde.current = null;
        setConfirmado(enviado);
        setSalvoEm(new Date());
        setErro(null);
      } else {
        setErro(resultado.erro);
      }
    },
    [salvar],
  );

  const sujo = valor !== confirmado;

  useEffect(() => {
    if (!sujo || salvando) return;

    sujoDesde.current ??= Date.now();

    // Piso de 500ms, teto de 30s desde que ficou sujo.
    const restante = tetoMs - (Date.now() - sujoDesde.current);
    const atraso = Math.max(0, Math.min(debounceMs, restante));

    const timer = setTimeout(() => void enviar(valor), atraso);
    return () => clearTimeout(timer);
  }, [valor, sujo, salvando, debounceMs, tetoMs, enviar]);

  const salvarAgora = useCallback(() => {
    if (valor !== confirmado) void enviar(valor);
  }, [valor, confirmado, enviar]);

  // Trocar de aba ou minimizar a janela não pode custar o que foi escrito.
  // `visibilitychange` é o último gancho em que ainda dá para disparar a
  // gravação — `beforeunload` não espera promessa.
  useEffect(() => {
    const aoEsconder = () => {
      if (document.visibilityState === "hidden") salvarAgora();
    };
    document.addEventListener("visibilitychange", aoEsconder);
    return () => document.removeEventListener("visibilitychange", aoEsconder);
  }, [salvarAgora]);

  const situacao: SituacaoDoAutosave = salvando
    ? "salvando"
    : erro
      ? "erro"
      : sujo
        ? "pendente"
        : "limpo";

  return { situacao, salvoEm, erro, salvarAgora };
}
