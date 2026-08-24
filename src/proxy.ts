import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseProxyClient } from "@/server/supabase/proxy";

/**
 * Proxy — renovação de sessão e checagem otimista de rota.
 *
 * ATENÇÃO: no Next 16 o arquivo `middleware.ts` foi DEPRECADO e renomeado para
 * `proxy.ts`, e a função exportada passou de `middleware` para `proxy`. Ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
 * O runtime padrão passou a ser Node.js, o que torna o SDK do Supabase
 * utilizável aqui sem ressalva de Edge.
 *
 * Duas responsabilidades, ambas baratas:
 *
 * 1. Renovar o token do Supabase e repassar os cookies. Sem isto, a sessão
 *    expira em abas abertas e Server Components passam a ver `null`.
 * 2. Redirecionar quem não tem cookie de sessão para `/login`, e quem tem para
 *    fora de `/login`.
 *
 * O passo 2 é **otimista**, no sentido que o guia de autenticação do Next dá ao
 * termo: decide por cookie, não por consulta ao banco, porque o proxy roda em
 * toda rota — inclusive nas prefetched. A checagem que vale é
 * `requireViewer()` em `server/auth/session.ts`, e depois dela a RLS.
 * Um cookie válido aqui não prova que existe perfil ativo.
 */

/** Rotas alcançáveis sem sessão. */
const ROTAS_PUBLICAS = ["/login", "/recuperar", "/redefinir", "/auth"];

function ehRotaPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseProxyClient(request);

  // Precisa ser `getUser()`: além de validar o token, é a chamada que dispara a
  // renovação e, por consequência, o `setAll` que grava os cookies novos.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const publica = ehRotaPublica(pathname);

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Preserva o destino para devolver o usuário onde ele estava.
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/recuperar")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // A resposta do cliente carrega os cookies renovados. Devolver qualquer outra
  // aqui descartaria a renovação.
  return getResponse();
}

export const config = {
  /**
   * Roda em tudo menos assets e o endpoint de health.
   *
   * O guia de autenticação recomenda que, para auth, o proxy rode em todas as
   * rotas; a exclusão abaixo evita apenas o que nunca carrega sessão. Sem esse
   * negative match o redirect de auth bloquearia CSS, JS e imagens.
   */
  matcher: [
    "/((?!_next/static|_next/image|api/health|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
