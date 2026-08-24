import type { EmailProvider, Mensagem, ResultadoEnvio } from "./types";

/**
 * Adaptador de desenvolvimento — imprime o e-mail em vez de enviar.
 *
 * É o **padrão**, de propósito: a aplicação funciona sem credencial nenhuma, e
 * quem clona o repositório consegue exercitar o fluxo de convite inteiro no
 * primeiro `npm run dev`.
 *
 * A alternativa seria falhar sem `EMAIL_PROVIDER` configurado. Rejeitada: um
 * convite que não sai por falta de variável de ambiente é indistinguível, para
 * quem convida, de um convite que saiu e não chegou.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly nome = "console";
  readonly entregaDeVerdade = false;

  async enviar(mensagem: Mensagem): Promise<ResultadoEnvio> {
    console.info(
      [
        "",
        "─".repeat(72),
        "E-MAIL (adaptador de console — nada foi enviado)",
        "─".repeat(72),
        `Para:    ${mensagem.para.nome ? `${mensagem.para.nome} <${mensagem.para.email}>` : mensagem.para.email}`,
        `Assunto: ${mensagem.assunto}`,
        "─".repeat(72),
        mensagem.texto,
        "─".repeat(72),
        "",
      ].join("\n"),
    );

    return { enviado: true, id: null };
  }
}
