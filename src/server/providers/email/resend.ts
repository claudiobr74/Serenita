import type { EmailProvider, Mensagem, ResultadoEnvio } from "./types";

/**
 * Adaptador Resend.
 *
 * Usa `fetch` direto contra a API HTTP, sem SDK. São duas chamadas possíveis e
 * um corpo JSON; um SDK aqui seria uma dependência a manter, com superfície
 * maior que o problema. Trocar por SendGrid, Postmark ou SES é escrever outro
 * arquivo deste tamanho — nada fora de `providers/email/` muda.
 *
 * Este é o **único** lugar do código que conhece o fornecedor. Há teste que
 * falha se `RESEND_API_KEY` ou o host da API aparecerem em qualquer outro
 * módulo. Ver docs/adr/005-email-transacional.md.
 */

const ENDPOINT = "https://api.resend.com/emails";

/** Erros do Resend chegam como JSON com `message`; a resposta crua é ruído. */
async function motivoDaFalha(resposta: Response): Promise<string> {
  try {
    const corpo: unknown = await resposta.json();
    if (
      typeof corpo === "object" &&
      corpo !== null &&
      "message" in corpo &&
      typeof corpo.message === "string"
    ) {
      return corpo.message;
    }
  } catch {
    // Resposta sem JSON: o status já diz o suficiente.
  }
  return `HTTP ${resposta.status}`;
}

export class ResendEmailProvider implements EmailProvider {
  readonly nome = "resend";
  readonly entregaDeVerdade = true;

  constructor(
    private readonly chave: string,
    private readonly remetente: string,
  ) {}

  async enviar(mensagem: Mensagem): Promise<ResultadoEnvio> {
    try {
      const resposta = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.chave}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.remetente,
          to: [mensagem.para.email],
          subject: mensagem.assunto,
          text: mensagem.texto,
          html: mensagem.html,
        }),
        // Sem timeout, um fornecedor lento seguraria a Server Action que
        // convida — e o convite já está gravado a essa altura.
        signal: AbortSignal.timeout(10_000),
      });

      if (!resposta.ok) {
        return { enviado: false, motivo: await motivoDaFalha(resposta) };
      }

      const corpo: unknown = await resposta.json();
      const id =
        typeof corpo === "object" && corpo !== null && "id" in corpo
          ? String(corpo.id)
          : null;

      return { enviado: true, id };
    } catch (causa) {
      const motivo =
        causa instanceof Error && causa.name === "TimeoutError"
          ? "tempo esgotado"
          : causa instanceof Error
            ? causa.message
            : "falha desconhecida";
      return { enviado: false, motivo };
    }
  }
}
