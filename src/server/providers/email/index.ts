import "server-only";

import { ConsoleEmailProvider } from "./console";
import { ResendEmailProvider } from "./resend";
import type { EmailProvider } from "./types";

export type {
  Destinatario,
  EmailProvider,
  Mensagem,
  ResultadoEnvio,
} from "./types";

/**
 * Escolhe o adaptador a partir do ambiente.
 *
 * Memoizado por módulo: não há estado por requisição, e reinstanciar a cada
 * envio não traria nada.
 */
let memoizado: EmailProvider | null = null;

export function obterEmailProvider(): EmailProvider {
  if (memoizado) return memoizado;
  memoizado = construir();
  return memoizado;
}

function construir(): EmailProvider {
  const escolhido = (process.env.EMAIL_PROVIDER ?? "console")
    .trim()
    .toLowerCase();

  if (escolhido === "console") return new ConsoleEmailProvider();

  if (escolhido === "resend") {
    const chave = process.env.RESEND_API_KEY?.trim();
    const remetente = process.env.EMAIL_REMETENTE?.trim();

    // Cair para console em silêncio seria pior do que gritar: em produção o
    // convite pareceria enviado e nunca chegaria.
    if (!chave || !remetente) {
      throw new Error(
        "EMAIL_PROVIDER=resend exige RESEND_API_KEY e EMAIL_REMETENTE. Consulte .env.example.",
      );
    }

    return new ResendEmailProvider(chave, remetente);
  }

  throw new Error(
    `EMAIL_PROVIDER desconhecido: "${escolhido}". Valores aceitos: console, resend.`,
  );
}

/** Só para teste: descarta a memoização entre casos. */
export function _redefinirEmailProvider(): void {
  memoizado = null;
}
