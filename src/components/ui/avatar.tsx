import { cn } from "@/lib/cn";

/**
 * Avatar — component set `Avatar` (12:186), 3 sizes.
 *
 * Spec medida: SM 32 · MD 40 · LG 56, todos radius full.
 *
 * O design-to-code mapping do Figma (12:637) especifica o fallback de iniciais:
 * `bg-surface-hover ... text-action-primary font-semibold`.
 *
 * Sem imagem remota por padrão: em contexto clínico, uma foto de paciente é
 * dado sensível e só deve ser carregada por caminho autorizado.
 */

type AvatarSize = "sm" | "md" | "lg";

const SIZE: Record<AvatarSize, string> = {
  sm: "size-8 text-caption",
  md: "size-10 text-body-sm",
  lg: "size-14 text-h4",
};

export type AvatarProps = {
  /** Nome completo. As iniciais são derivadas dele. */
  name: string;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      // O nome já aparece ao lado do avatar em todos os usos do Figma, então
      // repeti-lo para leitores de tela seria ruído.
      aria-hidden
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full",
        "bg-surface-hover font-semibold text-action-primary select-none",
        SIZE[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]![0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]![0]! : "";
  return (first + last).toUpperCase();
}
