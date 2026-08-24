import { NavIcon } from "@/components/shell/nav-icon";
import { cn } from "@/lib/cn";

/**
 * Dashboard — frame `dashboard` (6:40).
 *
 * FASE 1: apenas o bloco de saudação e os QuickMetrics (6:119), suficientes
 * para validar o shell e os tokens contra o Figma. Os valores são fixos e
 * fictícios; o restante da tela (agenda resumida, pendências, próxima sessão) e
 * a ligação com dados reais chegam nas fases correspondentes.
 *
 * QuickMetrics medido em 6:119:
 *   card: bg background-primary · border border-default · radius 16 · p 20 · gap 12
 *   label: 13px Instrument Sans SemiBold text-secondary + ícone 18
 *   valor: 28px Newsreader Bold text-primary
 */

const METRICS = [
  { label: "Sessões esta semana", value: "22", icon: "message-circle" },
  { label: "Pacientes ativos", value: "34", icon: "users" },
  { label: "Pendências clínicas", value: "5", icon: "triangle-alert" },
  { label: "Recebimentos do mês", value: "R$ 12.400", icon: "credit-card" },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-display font-bold text-text-primary">
          Bom dia, Dra. Mariana
        </h2>
        <p className="text-body text-text-secondary">
          Seu dia de atendimento está estruturado. Você possui 6 sessões hoje.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 tablet:grid-cols-2 desktop:grid-cols-4">
        {METRICS.map((metric) => (
          <li
            key={metric.label}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border border-border-default",
              "bg-background-primary p-5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-body-sm font-semibold text-text-secondary">
                {metric.label}
              </span>
              <NavIcon
                name={metric.icon}
                className="shrink-0 text-text-muted"
              />
            </div>
            <span className="font-display text-[28px] font-bold text-text-primary">
              {metric.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
