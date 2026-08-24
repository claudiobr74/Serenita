/**
 * Destino de redirecionamento pós-login.
 *
 * `next` chega da query string, então é entrada de usuário e não pode ser
 * usado como veio. Sem esta checagem, `?next=https://exemplo.com` transforma o
 * login num open redirect — o vetor clássico de phishing em tela de entrada:
 * o link parece do Serenità, o usuário autentica, e sai no site do atacante.
 *
 * Só caminho relativo desta aplicação é aceito.
 *
 * Vive em `domain/` porque a regra é a mesma na Server Action e no callback de
 * OAuth/magic link — uma definição só.
 */
export const DESTINO_PADRAO = "/dashboard";

export function destinoSeguro(next: string | null | undefined): string {
  if (!next) return DESTINO_PADRAO;

  // Precisa começar com uma barra: rejeita `https://...` e `javascript:...`.
  if (!next.startsWith("/")) return DESTINO_PADRAO;

  // `//evil.com` é URL protocol-relative — o browser trata como host externo.
  if (next.startsWith("//")) return DESTINO_PADRAO;

  // `/\evil.com` é normalizado para `//evil.com` por alguns browsers.
  if (next.startsWith("/\\")) return DESTINO_PADRAO;

  return next;
}
