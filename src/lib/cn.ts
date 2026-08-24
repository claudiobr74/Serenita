import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `cn` — junta classes e resolve conflitos do Tailwind.
 *
 * O `tailwind-merge` precisa ser ensinado sobre a escala tipográfica do
 * Serenità. Sem isso ele classifica `text-body` como cor (o grupo padrão de
 * `text-*`) e, ao encontrar `text-text-inverse` e `text-body` na mesma
 * chamada, descarta um deles silenciosamente.
 *
 * O sintoma foi real e passou despercebido por lint e typecheck: os botões
 * primários ficaram com texto `text-primary` sobre fundo verde escuro —
 * contraste 1.79:1, muito abaixo do mínimo AA de 4.5:1 exigido pelo Figma.
 * Só a auditoria de contraste no browser pegou.
 *
 * Os nomes abaixo precisam acompanhar os tokens `--text-*` de
 * `src/styles/tokens.css`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "body",
            "body-sm",
            "caption",
            "overline",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
