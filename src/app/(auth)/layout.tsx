/**
 * Layout das rotas públicas de autenticação.
 *
 * Frame `login` (6:9): página centrada, `bg-background-secondary`, padding 64,
 * com o BackgroundGlow de 600px atrás do card.
 *
 * Não usa o AppShell — não há sidebar nem topbar antes de existir sessão.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background-secondary p-8 desktop:p-16">
      {/*
        BackgroundGlow (6:10) — 600px, centrado, 50px acima do meio.
        O SVG exportado do Figma não pôde ser baixado neste ambiente (o policy
        de rede bloqueia o CDN da Figma). Enquanto ele não entra em
        `public/brand/login-glow.svg`, a geometria fica reservada com o mesmo
        tamanho e posição, para que a troca seja de uma linha.
        Ver docs/DESIGN_DECISIONS.md #21.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[calc(50%-50px)] left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-hover/40 blur-3xl"
      />
      <main className="relative z-10 w-full max-w-[440px]">{children}</main>
    </div>
  );
}
