"use client";

import { ShieldCheckIcon } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { AlertBanner, Button } from "@/components/ui";

/**
 * Consentimento de cookies — LGPD.
 *
 * Derivado do banner de consentimento desenhado em `6:6195`, o mesmo que
 * originou o `AlertBanner` na Fase 2.
 *
 * Escolha de produto, e não só técnica: o Serenità **não usa cookie de
 * rastreamento**. Os únicos cookies são os de sessão do Supabase, que a LGPD
 * classifica como estritamente necessários e que dispensam consentimento
 * prévio (art. 7º, V — execução do contrato). Então este banner **informa**,
 * ele não pede permissão para rastrear, e por isso não há botão "Rejeitar":
 * não existe nada opcional a rejeitar. Ver docs/DESIGN_DECISIONS.md #30.
 *
 * Quando a Fase 12 trouxer PostHog e Sentry, aí sim haverá categoria opcional,
 * e o banner precisará de escolha granular.
 *
 * O reconhecimento vive em `localStorage`, não em cookie: guardar em cookie a
 * preferência sobre cookies seria irônico, e localStorage não vai no cabeçalho
 * de toda requisição.
 */

const CHAVE = "serenita.lgpd.cookies.v1";

/**
 * O estado é lido com `useSyncExternalStore` em vez de `useState` + `useEffect`.
 *
 * `localStorage` não existe no servidor, então o valor precisa de um snapshot
 * de servidor distinto do de cliente — que é exatamente o que este hook
 * resolve. A alternativa (setState dentro de efeito) é o padrão que o
 * `react-hooks/set-state-in-effect` sinaliza, e produziria um render a mais.
 */
const ouvintes = new Set<() => void>();

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  return () => ouvintes.delete(aoMudar);
}

function notificar() {
  for (const ouvinte of ouvintes) ouvinte();
}

function jaReconheceuNoCliente(): boolean {
  try {
    return window.localStorage.getItem(CHAVE) !== null;
  } catch {
    // Navegação privada ou armazenamento bloqueado: tratar como reconhecido.
    // Um banner que nunca some é pior do que banner nenhum.
    return true;
  }
}

/** No servidor não há como saber, e piscar o banner é pior do que atrasá-lo. */
function jaReconheceuNoServidor(): boolean {
  return true;
}

export function ConsentimentoCookies() {
  const jaReconheceu = useSyncExternalStore(
    assinar,
    jaReconheceuNoCliente,
    jaReconheceuNoServidor,
  );

  const reconhecer = useCallback(() => {
    try {
      window.localStorage.setItem(CHAVE, new Date().toISOString());
    } catch {
      // Ver `jaReconheceuNoCliente`.
    }
    notificar();
  }, []);

  if (jaReconheceu) return null;

  return (
    <div
      // `role="region"` e não `alertdialog`: não bloqueia, não exige resposta
      // e não deve roubar o foco de quem está entrando na aplicação.
      role="region"
      aria-label="Aviso sobre cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[640px] desktop:inset-x-auto desktop:right-6"
    >
      <AlertBanner
        icon={ShieldCheckIcon}
        tone="info"
        title="Cookies estritamente necessários"
        description="Usamos apenas cookies de sessão, para manter você autenticada com segurança. Não há rastreamento, publicidade nem compartilhamento com terceiros."
        className="shadow-lg"
        action={
          <Button variant="primary" size="cta" onClick={reconhecer}>
            Entendi
          </Button>
        }
      />
    </div>
  );
}
