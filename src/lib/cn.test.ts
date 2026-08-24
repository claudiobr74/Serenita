import { describe, expect, it } from "vitest";

import { cn } from "./cn";

/**
 * Regressão de docs/DESIGN_DECISIONS.md #18.
 *
 * O `tailwind-merge` classificava `text-body` como cor e descartava
 * `text-text-inverse`, deixando os botões primários com texto escuro sobre
 * fundo verde — 1.79:1. Lint, typecheck e build passavam.
 *
 * Se alguém adicionar um token `--text-*` novo em tokens.css e esquecer de
 * declará-lo em `cn`, este teste falha.
 */

const FONT_SIZES = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "body",
  "body-sm",
  "caption",
  "overline",
] as const;

describe("cn — escala tipográfica versus cor", () => {
  it.each(FONT_SIZES)("preserva a cor do texto junto com text-%s", (size) => {
    const result = cn("text-text-inverse", `text-${size}`);
    expect(result).toContain("text-text-inverse");
    expect(result).toContain(`text-${size}`);
  });

  it("ainda resolve conflitos reais de cor", () => {
    expect(cn("text-text-primary", "text-text-inverse")).toBe(
      "text-text-inverse",
    );
  });

  it("ainda resolve conflitos reais de tamanho", () => {
    expect(cn("text-body", "text-h1")).toBe("text-h1");
  });

  it("preserva cor e tamanho na ordem em que o Button os aplica", () => {
    // VARIANT vem antes de SIZE em button.tsx — exatamente o caso do bug.
    const result = cn(
      "bg-action-primary text-text-inverse",
      "min-h-10 rounded-md px-4 py-2 text-body font-medium",
    );
    expect(result).toContain("text-text-inverse");
    expect(result).toContain("bg-action-primary");
  });
});
