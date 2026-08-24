import { cn } from "@/lib/cn";

/**
 * Marcador explícito de rota ainda não implementada.
 *
 * Existe para que a navegação do shell seja percorrível durante o QA visual da
 * Fase 1 sem que uma tela vazia possa ser confundida com trabalho concluído.
 * Cada ocorrência nomeia a fase que a substitui e o frame do Figma que a define.
 *
 * Toda instância deve desaparecer até o fim da fase correspondente. Ver
 * IMPLEMENTATION_PLAN.md.
 */
export function PhasePlaceholder({
  screen,
  phase,
  figmaNode,
}: {
  screen: string;
  phase: string;
  figmaNode: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border border-dashed",
        "border-border-default bg-background-primary p-8",
      )}
    >
      <span className="text-overline font-medium tracking-wide text-text-secondary uppercase">
        Não implementado
      </span>
      <h2 className="font-display text-h2 font-semibold text-text-primary">
        {screen}
      </h2>
      <p className="text-body text-text-secondary">
        Esta tela é entregue na <strong>{phase}</strong>. Definida no Figma em{" "}
        <code className="font-mono text-body-sm">{figmaNode}</code>.
      </p>
    </div>
  );
}
