import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Health check.
 *
 * Confirma que a aplicação alcança o Supabase e — mais importante — que a RLS
 * está de fato barrando leitura anônima. Um `clinics` legível sem sessão seria
 * vazamento cross-tenant, então a resposta esperada aqui é **zero linhas**.
 *
 * Não expõe detalhe técnico de erro; apenas o veredito.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error, count } = await supabase
      .from("clinics")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json(
        { status: "degraded", database: "unreachable" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      database: "reachable",
      // Sem sessão, a RLS deve devolver zero linhas.
      rlsBlocksAnonymousRead: count === 0,
    });
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unreachable" },
      { status: 503 },
    );
  }
}
