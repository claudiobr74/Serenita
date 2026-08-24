import { z } from "zod";

/**
 * Validação de variáveis de ambiente.
 *
 * Falhar no boot é preferível a falhar em produção com `undefined` chegando
 * numa chamada de API. Ver docs/ARCHITECTURE.md §12.
 *
 * Variáveis server-only NUNCA aparecem em `publicSchema` — o prefixo
 * `NEXT_PUBLIC_` embute o valor no bundle do cliente.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

/**
 * Next.js substitui `process.env.NEXT_PUBLIC_*` estaticamente no build, então
 * as referências precisam ser literais — não `process.env[nome]`.
 */
const parsed = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  throw new Error(
    `Variáveis de ambiente ausentes ou inválidas: ${missing}. Consulte .env.example.`,
  );
}

export const env = parsed.data;
