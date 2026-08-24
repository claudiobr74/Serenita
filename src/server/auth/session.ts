import "server-only";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Clinic, Profile, Role } from "@/domain/auth/types";
import { ROLES } from "@/domain/auth/types";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Camada de acesso a dados de autenticação.
 *
 * É a checagem **real** de autorização. O `proxy.ts` faz apenas a checagem
 * otimista pelo cookie — o guia de autenticação do Next 16 é explícito em que
 * a verificação séria deve ficar o mais perto possível da fonte de dados, e o
 * proxy roda também em rotas prefetched.
 *
 * `cache()` do React memoiza por render pass: chamar `getCurrentProfile()` no
 * layout e de novo numa página não gera duas idas ao banco.
 *
 * Terceira camada, sempre: mesmo que isto falhe, a RLS barra no banco. Ver
 * docs/adr/001-multi-tenancy.md.
 */

export type Viewer = {
  readonly userId: string;
  readonly email: string | null;
  readonly profile: Profile;
  readonly clinic: Clinic;
};

/**
 * Usuário autenticado, ou `null`.
 *
 * Usa `getUser()`, que valida o token no servidor — e não `getSession()`, que
 * apenas lê o cookie e é falsificável.
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
});

function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/**
 * Perfil e clínica do usuário autenticado, ou `null` se não houver sessão.
 *
 * Uma única consulta, com a clínica embutida: a RLS de `profiles` já restringe
 * à própria clínica, e a de `clinics` ao próprio tenant, então não há como esta
 * leitura atravessar tenant nem que o `id` fosse forjado.
 *
 * Devolve `null` — e não lança — para que a página decida entre redirecionar e
 * renderizar estado de erro.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, clinic_id, full_name, role, avatar_url, crp, clinics (id, name, slug, logo_url)",
    )
    .eq("id", user.id)
    .is("archived_at", null)
    .maybeSingle();

  if (error || !data || !data.clinics) return null;
  // O enum do banco e `ROLES` são a mesma lista, mas o tipo gerado é `string`
  // depois do select aninhado; a checagem mantém o domínio honesto.
  if (!isRole(data.role)) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: {
      id: data.id,
      clinicId: data.clinic_id,
      fullName: data.full_name,
      role: data.role,
      avatarUrl: data.avatar_url,
      crp: data.crp,
    },
    clinic: {
      id: data.clinics.id,
      name: data.clinics.name,
      slug: data.clinics.slug,
      logoUrl: data.clinics.logo_url,
    },
  };
});

/**
 * Igual a `getViewer()`, mas redireciona para `/login` sem sessão.
 *
 * É o que as rotas da área autenticada usam. O `next` preserva o destino para
 * que o login devolva o usuário onde ele estava.
 */
export async function requireViewer(returnTo?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer) return viewer;

  const destino = returnTo
    ? `/login?next=${encodeURIComponent(returnTo)}`
    : "/login";
  // `typedRoutes` só valida literais; a query string torna esta computada.
  redirect(destino as Route);
}
