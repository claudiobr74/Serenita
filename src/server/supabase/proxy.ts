import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Cliente Supabase para o `proxy.ts`.
 *
 * Existe separado de `server.ts` porque ali os cookies vêm de `next/headers`,
 * e aqui vêm do par `NextRequest`/`NextResponse`. A escrita precisa acontecer
 * nos DOIS: no request para que o restante do proxy enxergue a sessão
 * renovada, e no response para que o browser a receba.
 *
 * Devolve o cliente junto da resposta que deve ser retornada — descartar essa
 * resposta descarta os cookies renovados e desloga o usuário silenciosamente.
 */
export function createSupabaseProxyClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  return { supabase, getResponse: () => response };
}
