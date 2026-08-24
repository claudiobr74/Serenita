import { notFound } from "next/navigation";

import { cn } from "@/lib/cn";

import { Showcase } from "./showcase";

/**
 * Component playground — rota interna de desenvolvimento.
 *
 * NÃO exposta em produção: `notFound()` quando NODE_ENV === "production".
 * Ver next.config.ts, que também bloqueia a rota via rewrite.
 *
 * FASE 1: exibe apenas o token layer, para comparação direta com
 * `01 — FOUNDATIONS`. Os componentes entram aqui conforme forem implementados
 * na Fase 2, cada um com suas variants, states e sizes.
 */

export const dynamic = "force-static";

/** [variável CSS, nome do token no Figma, hex, uso declarado] */
type Swatch = readonly [string, string, string, string];

const BACKGROUNDS: readonly Swatch[] = [
  [
    "--color-background-primary",
    "color/background/primary",
    "#FFFFFF",
    "Cards, surfaces",
  ],
  [
    "--color-background-secondary",
    "color/background/secondary",
    "#FBF9F6",
    "Page background",
  ],
  ["--color-surface-hover", "color/surface/hover", "#EAEFEA", "Hover states"],
  [
    "--color-surface-muted",
    "color/surface/muted",
    "#F0F1F0",
    "Input disabled, Badge neutral",
  ],
];

const TEXT: readonly Swatch[] = [
  ["--color-text-primary", "color/text/primary", "#1F2421", "Headings, body"],
  [
    "--color-text-secondary",
    "color/text/secondary",
    "#5D625E",
    "Secondary info",
  ],
  ["--color-text-muted", "color/text/muted", "#8A8F8A", "Placeholders, hints"],
];

const ACTIONS: readonly Swatch[] = [
  ["--color-action-primary", "color/action/primary", "#3A4F43", "Primary CTA"],
  [
    "--color-action-primary-hover",
    "color/action/primaryHover",
    "#2D3E34",
    "Primary hover",
  ],
  [
    "--color-action-secondary",
    "color/action/secondary",
    "#EAE6DF",
    "Secondary button",
  ],
  [
    "--color-action-danger",
    "color/action/danger",
    "#C2735A",
    "Destructive actions",
  ],
];

const STATUS: readonly Swatch[] = [
  [
    "--color-status-success",
    "color/status/success",
    "#3A7D5C",
    "Success text/icon",
  ],
  [
    "--color-status-warning",
    "color/status/warning",
    "#D6A374",
    "Warning text/icon",
  ],
  ["--color-status-error", "color/status/error", "#C2735A", "Error text/icon"],
  ["--color-status-info", "color/status/info", "#5B7FA6", "Info text/icon"],
];

const TYPE_SCALE = [
  ["Display", "text-display", "32 / 40 · Bold"],
  ["H1", "text-h1", "24 / 32 · SemiBold"],
  ["H2", "text-h2", "20 / 28 · SemiBold"],
  ["H3", "text-h3", "18 / 24 · SemiBold"],
  ["H4", "text-h4", "16 / 22 · Medium"],
  ["Body", "text-body", "14 / 20 · Regular"],
  ["Body Small", "text-body-sm", "13 / 18 · Regular"],
  ["Caption", "text-caption", "12 / 16 · Regular"],
  ["Overline", "text-overline", "11 / 14 · Medium"],
] as const;

const SPACING = [
  ["space/1", "4px", "w-1"],
  ["space/2", "8px", "w-2"],
  ["space/3", "12px", "w-3"],
  ["space/4", "16px", "w-4"],
  ["space/6", "24px", "w-6"],
  ["space/8", "32px", "w-8"],
  ["space/10", "40px", "w-10"],
  ["space/12", "48px", "w-12"],
  ["space/16", "64px", "w-16"],
] as const;

const RADIUS = [
  ["radius/xs", "4px", "rounded-xs"],
  ["radius/sm", "6px", "rounded-sm"],
  ["radius/md", "8px", "rounded-md"],
  ["radius/lg", "10px", "rounded-lg"],
  ["radius/xl", "12px", "rounded-xl"],
  ["radius/2xl", "16px", "rounded-2xl"],
  ["radius/full", "9999px", "rounded-full"],
] as const;

const SHADOWS = [
  ["shadow/sm", "Card Elevated", "shadow-sm"],
  ["shadow/md", "Toast", "shadow-md"],
  ["shadow/lg", "Modal", "shadow-lg"],
] as const;

const MOTION = [
  ["motion/fast", "150ms", "Hover, tooltip, checkbox"],
  ["motion/standard", "250ms", "Modal, dropdown, card expand"],
  ["motion/slow", "350ms", "Página, matched geometry"],
  ["motion/sheet", "400ms", "Bottom sheet, modo sessão"],
  ["motion/spring-subtle", "200ms", "Micro-interações"],
] as const;

export default function ComponentPlaygroundPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh bg-background-secondary p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-2">
          <p className="text-overline font-medium tracking-wide text-text-secondary uppercase">
            Serenità · Development only
          </p>
          <h1 className="font-display text-display font-bold text-text-primary">
            Component Playground
          </h1>
          <p className="text-body text-text-secondary">
            Design tokens extraídos de{" "}
            <code className="font-mono text-body-sm">01 — FOUNDATIONS</code>.
            Compare lado a lado com o Figma. Cada seção nomeia o node de onde a
            spec veio.
          </p>
        </header>

        <Showcase />

        <Section title="Cores — Backgrounds">
          <Swatches items={BACKGROUNDS} />
        </Section>
        <Section title="Cores — Texto">
          <Swatches items={TEXT} />
        </Section>
        <Section title="Cores — Ações">
          <Swatches items={ACTIONS} />
        </Section>
        <Section title="Cores — Status">
          <Swatches items={STATUS} />
        </Section>

        <Section title="Tipografia">
          <div className="flex flex-col gap-4">
            {TYPE_SCALE.map(([name, cls, spec]) => (
              <div
                key={name}
                className="flex items-baseline justify-between gap-4 border-b border-border-default pb-3"
              >
                <span className={cn(cls, "font-display text-text-primary")}>
                  {name} — Serenitá
                </span>
                <span className="shrink-0 font-mono text-caption text-text-secondary">
                  {spec}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Espaçamento">
          <div className="flex flex-col gap-2">
            {SPACING.map(([name, value, cls]) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-24 font-mono text-caption text-text-secondary">
                  {name}
                </span>
                <span className={cn("h-6 bg-action-primary", cls)} />
                <span className="font-mono text-caption text-text-secondary">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius">
          <div className="flex flex-wrap gap-4">
            {RADIUS.map(([name, value, cls]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "size-16 border border-border-default bg-background-primary",
                    cls,
                  )}
                />
                <span className="font-mono text-caption text-text-secondary">
                  {name}
                </span>
                <span className="font-mono text-caption text-text-secondary">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Sombras">
          <div className="flex flex-wrap gap-6">
            {SHADOWS.map(([name, usage, cls]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "size-20 rounded-xl bg-background-primary",
                    cls,
                  )}
                />
                <span className="font-mono text-caption text-text-secondary">
                  {name}
                </span>
                <span className="text-caption text-text-secondary">
                  {usage}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Motion">
          <div className="flex flex-col gap-2">
            {MOTION.map(([name, duration, usage]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 border-b border-border-default pb-2"
              >
                <span className="font-mono text-body-sm text-text-primary">
                  {name}
                </span>
                <span className="font-mono text-caption text-text-secondary">
                  {duration}
                </span>
                <span className="flex-1 text-right text-caption text-text-secondary">
                  {usage}
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-default bg-background-primary p-6">
      <h2 className="font-display text-h2 font-semibold text-text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatches({ items }: { items: readonly Swatch[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 desktop:grid-cols-4">
      {items.map(([cssVar, figmaToken, hex, usage]) => (
        <div key={cssVar} className="flex flex-col gap-2">
          <span
            className="h-16 rounded-md border border-border-default"
            style={{ backgroundColor: `var(${cssVar})` }}
          />
          <span className="font-mono text-caption text-text-primary">
            {figmaToken}
          </span>
          <span className="font-mono text-caption text-text-secondary">
            {hex} · {usage}
          </span>
        </div>
      ))}
    </div>
  );
}
