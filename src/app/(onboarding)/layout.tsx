import Image from "next/image";

/**
 * Layout do wizard de onboarding.
 *
 * Mesma moldura do frame de login — `bg-background-secondary`, centrado, com o
 * BackgroundGlow (6:5214) atrás — mas o card tem 480px em vez de 440px, e há a
 * ProgressBar ancorada ao topo, que a página posiciona.
 *
 * Fora do AppShell de propósito: durante o wizard não há sidebar nem topbar.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background-secondary p-8 desktop:p-16">
      <Image
        src="/brand/login-glow.png"
        alt=""
        width={600}
        height={600}
        aria-hidden
        className="pointer-events-none absolute top-[calc(50%-50px)] left-1/2 size-[600px] max-w-none -translate-x-1/2 -translate-y-1/2"
      />
      <main className="relative z-10 w-full max-w-[480px]">{children}</main>
    </div>
  );
}
