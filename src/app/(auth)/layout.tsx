import Image from "next/image";

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
        BackgroundGlow (6:10) — 600px, centrado, 50px acima do meio, exatamente
        a geometria do frame. `max-w-none` impede o reset de imagem responsiva
        de encolher o brilho em telas estreitas: ele é decoração de fundo e deve
        transbordar, o que o `overflow-hidden` do container contém.
      */}
      <Image
        src="/brand/login-glow.png"
        alt=""
        width={600}
        height={600}
        aria-hidden
        className="pointer-events-none absolute top-[calc(50%-50px)] left-1/2 size-[600px] max-w-none -translate-x-1/2 -translate-y-1/2"
      />
      <main className="relative z-10 w-full max-w-[440px]">{children}</main>
    </div>
  );
}
