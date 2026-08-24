import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

import type { Database } from "./database.types";

/**
 * Cliente Supabase para o browser.
 *
 * Só a chave publishable chega aqui. A `service_role` NUNCA vai para o browser
 * — ela contorna RLS e daria acesso irrestrito a prontuário.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
