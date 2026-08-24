import type { Route } from "next";
import { redirect } from "next/navigation";

import { requireViewer } from "@/server/auth/session";

import { secoesVisiveisPara } from "./secoes";

/**
 * `/configuracoes` não tem tela própria no Figma: o frame 6:4989 já abre numa
 * seção selecionada.
 *
 * Redireciona para a primeira seção **que o papel enxerga** — mandar todo mundo
 * para `/configuracoes/usuarios` faria o psicólogo bater no guard de admin.
 */
export default async function ConfiguracoesPage() {
  const { profile } = await requireViewer();

  const primeira = secoesVisiveisPara(profile.role).find(
    (secao) => secao.href !== undefined,
  );

  redirect((primeira?.href ?? "/dashboard") as Route);
}
