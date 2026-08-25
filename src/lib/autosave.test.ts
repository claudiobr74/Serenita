import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type ResultadoDoAutosave, useAutosave } from "./autosave";

/**
 * O autosave guarda prontuário. As duas propriedades que importam aqui são as
 * que a spec pede ao mesmo tempo e que se contradizem na prática:
 *
 *   - debounce de 500ms  -> não gravar a cada tecla
 *   - salvar a cada 30s  -> quem digita sem parar não fica sem gravar
 *
 * Ver docs/ARCHITECTURE.md §15.
 */

const OK: ResultadoDoAutosave = { ok: true };

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function montar(salvar: (valor: string) => Promise<ResultadoDoAutosave>) {
  return renderHook(
    ({ valor }: { valor: string }) =>
      useAutosave({ valor, valorInicial: "", salvar }),
    { initialProps: { valor: "" } },
  );
}

describe("useAutosave", () => {
  it("começa limpo e sem timestamp", () => {
    const { result } = montar(async () => OK);
    expect(result.current.situacao).toBe("limpo");
    expect(result.current.salvoEm).toBeNull();
  });

  it("fica pendente assim que o valor diverge do confirmado", () => {
    const { result, rerender } = montar(async () => OK);
    rerender({ valor: "a" });
    expect(result.current.situacao).toBe("pendente");
  });

  it("não grava antes dos 500ms", async () => {
    const salvar = vi.fn(async () => OK);
    const { rerender } = montar(salvar);

    rerender({ valor: "ans" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(499);
    });

    expect(salvar).not.toHaveBeenCalled();
  });

  it("grava uma vez só depois de uma rajada de teclas", async () => {
    const salvar = vi.fn(async () => OK);
    const { result, rerender } = montar(salvar);

    for (const valor of ["a", "an", "ans", "ansi"]) {
      rerender({ valor });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
    }

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(salvar).toHaveBeenCalledTimes(1);
    expect(salvar).toHaveBeenCalledWith("ansi");
    expect(result.current.situacao).toBe("limpo");
    expect(result.current.salvoEm).toBeInstanceOf(Date);
  });

  // A propriedade que o debounce sozinho NÃO dá: quem nunca para de digitar
  // ficaria indefinidamente sem gravar.
  it("grava ao bater o teto de 30s mesmo com digitação contínua", async () => {
    const salvar = vi
      .fn<(valor: string) => Promise<ResultadoDoAutosave>>()
      .mockResolvedValue(OK);
    const { rerender } = montar(salvar);

    // Teclas a cada 300ms: o debounce de 500ms sozinho NUNCA fecharia, porque
    // cada tecla reagenda o timer antes de ele vencer.
    let texto = "";
    for (let i = 0; i < 150; i += 1) {
      texto += "x";
      rerender({ valor: texto });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
    }

    expect(salvar).toHaveBeenCalled();

    // 30s / 300ms por tecla = ~100 caracteres quando o teto vence.
    const primeiroEnvio = salvar.mock.calls[0]?.[0] ?? "";
    expect(primeiroEnvio.length).toBeGreaterThanOrEqual(95);
    expect(primeiroEnvio.length).toBeLessThanOrEqual(105);
  });

  it("reporta erro sem descartar o texto e tenta de novo na tecla seguinte", async () => {
    const salvar = vi
      .fn<(valor: string) => Promise<ResultadoDoAutosave>>()
      .mockResolvedValueOnce({ ok: false, erro: "Não foi possível salvar." })
      .mockResolvedValue(OK);

    const { result, rerender } = montar(salvar);

    rerender({ valor: "a" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.situacao).toBe("erro");
    expect(result.current.erro).toBe("Não foi possível salvar.");

    rerender({ valor: "ab" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(result.current.situacao).toBe("limpo");
    expect(salvar).toHaveBeenCalledTimes(2);
  });

  it("salvarAgora dispara sem esperar o debounce", async () => {
    const salvar = vi.fn(async () => OK);
    const { result, rerender } = montar(salvar);

    rerender({ valor: "urgente" });
    await act(async () => {
      result.current.salvarAgora();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(salvar).toHaveBeenCalledWith("urgente");
  });

  it("salvarAgora não grava quando nada mudou", async () => {
    const salvar = vi.fn(async () => OK);
    const { result } = montar(salvar);

    await act(async () => {
      result.current.salvarAgora();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(salvar).not.toHaveBeenCalled();
  });
});
