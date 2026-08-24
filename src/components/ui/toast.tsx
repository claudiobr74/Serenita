"use client";

import {
  CheckCircle2Icon,
  InfoIcon,
  TriangleAlertIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { cn } from "@/lib/cn";

/**
 * Toast.
 *
 * O Figma tem DOIS designs de toast e eles divergem. Seguimos o das telas de
 * `06 — DESKTOP / error-warning-states` (6:6212), pelo mesmo precedente da
 * sidebar — ver docs/DESIGN_DECISIONS.md #1 e #15.
 *
 * Spec medida (6:6212, 6:6218, 6:6224):
 *   p 16 · gap 12 · radius 12 · shadow-toast · ícone 18 · fechar 14
 *   título 13 SemiBold · mensagem 12
 *   success  bg action-primary · título branco · mensagem surface-hover
 *   error    bg action-danger  · título branco · mensagem branca

 * Desvio: o Figma usa `status-error-bg` (#F9ECE8) na mensagem do toast de erro.
 * Sobre o `action-danger` corrigido isso dá 3.96:1, abaixo de AA — e, sendo o
 * fundo já escuro, branco (4.57:1) é o único tom que atinge o mínimo. A
 * hierarquia entre título e mensagem passa a vir de peso e tamanho, como já
 * acontece no toast de sucesso. Ver docs/DESIGN_DECISIONS.md #17.
 *   info     bg background-primary + border · título text-primary · msg text-secondary
 *
 * `03 — PATTERNS / Error Handling`: toast é para erros **recuperáveis**. Falha
 * de submit usa banner inline; 500/rede usa estado de página inteira.
 *
 * O tipo nunca é comunicado só por cor — há ícone e texto, conforme a
 * exigência de acessibilidade do Figma.
 */

type ToastType = "success" | "warning" | "error" | "info";

const SURFACE: Record<ToastType, string> = {
  success: "bg-action-primary",
  error: "bg-action-danger",
  warning: "border border-status-warning bg-status-warning-bg",
  info: "border border-border-default bg-background-primary",
};

const TITLE: Record<ToastType, string> = {
  success: "text-text-inverse",
  error: "text-text-inverse",
  warning: "text-text-primary",
  info: "text-text-primary",
};

const MESSAGE: Record<ToastType, string> = {
  success: "text-surface-hover",
  error: "text-text-inverse",
  warning: "text-text-secondary",
  info: "text-text-secondary",
};

const ICON = {
  success: CheckCircle2Icon,
  error: XCircleIcon,
  warning: TriangleAlertIcon,
  info: InfoIcon,
} as const;

const ICON_COLOR: Record<ToastType, string> = {
  success: "text-text-inverse",
  error: "text-text-inverse",
  warning: "text-status-warning-text",
  info: "text-text-muted",
};

export type ToastProps = {
  type?: ToastType;
  title: string;
  message?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
};

export function Toast({
  type = "info",
  title,
  message,
  onDismiss,
  dismissLabel = "Dispensar",
}: ToastProps) {
  const Icon = ICON[type];

  return (
    <div
      // Erro interrompe a leitura; os demais aguardam uma pausa.
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-4 shadow-toast",
        SURFACE[type],
      )}
    >
      <Icon
        size={18}
        className={cn("shrink-0", ICON_COLOR[type])}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn("text-body-sm font-semibold", TITLE[type])}>{title}</p>
        {message && (
          <p className={cn("text-caption", MESSAGE[type])}>{message}</p>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-sm",
            "duration-fast transition-opacity ease-standard hover:opacity-70",
            ICON_COLOR[type],
          )}
        >
          <XIcon size={14} aria-hidden />
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- *
 * Provider
 * -------------------------------------------------------------------------- */

type ToastEntry = ToastProps & { id: string };

type ToastContextValue = {
  /** Enfileira um toast. Retorna o id, para dispensa programática. */
  toast: (input: Omit<ToastProps, "onDismiss">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback((input: Omit<ToastProps, "onDismiss">) => {
    const id = crypto.randomUUID();
    setEntries((current) => [...current, { ...input, id }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // `aria-live` no container, não no toast: o container existe desde o
        // início, então leitores de tela anunciam o que for inserido nele.
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed right-6 bottom-6 z-50",
          "flex w-100 max-w-[calc(100vw-3rem)] flex-col gap-4",
        )}
      >
        {entries.map((entry) => (
          <div key={entry.id} className="pointer-events-auto">
            <Toast {...entry} onDismiss={() => dismiss(entry.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  }
  return context;
}
