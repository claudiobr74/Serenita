import { RefreshCwIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Estados de processamento — derivados de `loading-sync-states` (6:6071).
 *
 * O Figma desenha três processamentos distintos, cada um com sua própria
 * linguagem visual. Eles não são intercambiáveis: a forma comunica o que está
 * acontecendo antes de o texto ser lido.
 */

/* -------------------------------------------------------------------------- *
 * MonoChip — o rótulo de status recorrente das telas de estado.
 * bg surface-hover · px 10 · py 4 · radius 6 · JetBrains Mono Bold 11.
 * -------------------------------------------------------------------------- */

export function MonoChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-surface-hover px-2.5 py-1",
        "font-mono text-overline font-bold text-action-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- *
 * AudioWaveform — transcrição em curso (6:6122)
 * 16 barras de 3px, radius 1.5, action-primary, alturas fixas, algumas a 40%.
 * -------------------------------------------------------------------------- */

/** Alturas medidas barra a barra no frame. `dim` marca as de opacidade 40%. */
const BARS: readonly { h: number; dim: boolean }[] = [
  { h: 6, dim: true },
  { h: 24, dim: false },
  { h: 38, dim: false },
  { h: 12, dim: true },
  { h: 28, dim: false },
  { h: 44, dim: false },
  { h: 18, dim: true },
  { h: 30, dim: false },
  { h: 8, dim: false },
  { h: 22, dim: true },
  { h: 14, dim: false },
  { h: 32, dim: false },
  { h: 8, dim: true },
  { h: 18, dim: false },
  { h: 40, dim: false },
  { h: 20, dim: true },
];

export function AudioWaveform({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex h-10 items-center gap-1", className)}>
      {BARS.map((bar, index) => (
        <span
          key={index}
          style={{ height: `${bar.h}px` }}
          className={cn(
            "w-[3px] shrink-0 rounded-[1.5px] bg-action-primary",
            bar.dim && "opacity-40",
          )}
        />
      ))}
    </div>
  );
}

/**
 * TranscriptionProcessing — 6:6121.
 * Waveform + título 14 SemiBold action-primary + detalhe 12 text-muted.
 */
export function TranscriptionProcessing({
  title = "Transcrevendo Áudio da Sessão",
  detail,
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl",
        "border border-border-default bg-background-primary p-8",
      )}
    >
      <AudioWaveform />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-body font-semibold text-action-primary">{title}</p>
        {detail && <p className="text-caption text-text-secondary">{detail}</p>}
      </div>
    </div>
  );
}

/**
 * SyncProcessing — 6:6142.
 * Anel 48 com borda 4 border-default, miolo 32 surface-hover, ícone 18.
 */
export function SyncProcessing({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl",
        "border border-border-default bg-background-primary p-8",
      )}
    >
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full border-4 border-border-default"
      >
        <span className="grid size-8 place-items-center rounded-full bg-surface-hover text-action-primary">
          <RefreshCwIcon size={18} className="animate-spin" />
        </span>
      </span>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-body font-semibold text-text-primary">{title}</p>
        {detail && <p className="text-caption text-text-secondary">{detail}</p>}
      </div>
    </div>
  );
}

/**
 * AIProcessing — 6:6149.
 * Sparkles 24 + "Supervisor IA" Newsreader Bold 20 action-primary,
 * descrição 13 text-secondary centralizada (w 280), chip de progresso.
 *
 * O progresso é anunciado como texto, não só como cor ou barra — exigência de
 * acessibilidade do Figma para indicadores de IA.
 */
export function AIProcessing({
  label = "Supervisor IA",
  description,
  progressLabel,
}: {
  label?: string;
  description: string;
  progressLabel?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl",
        "border border-border-default bg-background-primary p-8",
      )}
    >
      <div className="flex items-center gap-2">
        <SparklesIcon size={24} className="text-action-primary" aria-hidden />
        <p className="font-display text-h2 font-bold text-action-primary">
          {label}
        </p>
      </div>
      <p className="w-70 max-w-full text-center text-body-sm text-text-secondary">
        {description}
      </p>
      {progressLabel && <MonoChip>{progressLabel}</MonoChip>}
    </div>
  );
}
