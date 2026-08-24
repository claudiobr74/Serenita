import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Cliente Supabase para Server Components, Server Actions e route handlers.
 *
 * Usa a chave publishable e opera SEMPRE sob RLS, na identidade do usuário
 * autenticado. É o cliente padrão — a `service_role` é exceção justificada.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components não podem escrever cookies. Quem renova a
            // sessão é o `proxy.ts` — `middleware.ts` foi deprecado no Next 16
            // e renomeado. Ignorar aqui é seguro e esperado.
          }
        },
      },
    },
  );
}
