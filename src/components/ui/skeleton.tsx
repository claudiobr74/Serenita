import { cn } from "@/lib/cn";

/**
 * Skeleton — derivado de `loading-sync-states` (6:6071).
 *
 * `03 — PATTERNS / Loading`: skeleton para carregamento inicial, imitando o
 * layout do conteúdo. Spinner só para updates in-place. **Nunca bloquear a
 * página inteira** — apenas a área de conteúdo.
 *
 * Três tons quentes medidos no frame: `base` (#F0ECE6) para o elemento
 * principal, `subtle` (#F7F5F0) para a linha secundária, `strong` (#E8E2D9)
 * para blocos de destaque.
 *
 * A pulsação é decorativa e some sob `prefers-reduced-motion` (globals.css).
 */

type SkeletonTone = "base" | "subtle" | "strong";

const TONE: Record<SkeletonTone, string> = {
  base: "bg-skeleton-base",
  subtle: "bg-skeleton-subtle",
  strong: "bg-skeleton-strong",
};

export type SkeletonProps = {
  tone?: SkeletonTone;
  className?: string;
};

export function Skeleton({ tone = "base", className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn("block animate-pulse rounded-xs", TONE[tone], className)}
    />
  );
}

/**
 * Linha de lista em carregamento — spec medida em 6:6084.
 *
 *   py 8 · gap 16 · avatar 32 radius full
 *   título 12×140 radius 4 · subtítulo 8×60 radius 4 tom subtle
 *   ação 24×80 radius 6
 */
export function SkeletonListItem() {
  return (
    <div className="flex w-full items-center gap-4 py-2">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-35" />
        <Skeleton tone="subtle" className="h-2 w-15" />
      </div>
      <Skeleton className="h-6 w-20 shrink-0 rounded-sm" />
    </div>
  );
}

/**
 * Lista em carregamento, com o rótulo anunciado para leitores de tela.
 * O conteúdo visual é `aria-hidden`; o status é o que importa.
 */
export function SkeletonList({
  rows = 4,
  label = "Carregando...",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonListItem key={index} />
      ))}
    </div>
  );
}
