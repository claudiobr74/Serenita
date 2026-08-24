import { type NextRequest, NextResponse } from "next/server";

import { destinoSeguro } from "@/domain/auth/redirect";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Callback de magic link e recuperação de senha.
 *
 * O Supabase redireciona para cá com um `code` de uso único, que é trocado pela
 * sessão. A troca precisa acontecer no servidor: é ela que grava os cookies
 * `httpOnly`.
 *
 * Link expirado ou já usado volta para `/login` com o erro — sem stack trace e
 * sem eco do código na URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // `next` vem da URL, então é entrada de usuário. Mesma regra da Server
  // Action, uma definição só.
  const destino = destinoSeguro(next);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?erro=link_expirado`);
  }

  return NextResponse.redirect(`${origin}${destino}`);
}
