import { redirect } from "next/navigation";

/**
 * `/configuracoes` não tem tela própria no Figma: o frame 6:4989 já abre numa
 * seção selecionada. Redireciona para a primeira seção implementada.
 */
export default function ConfiguracoesPage() {
  redirect("/configuracoes/usuarios");
}
