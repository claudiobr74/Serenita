/**
 * Porta de envio de e-mail.
 *
 * Mesma forma do `AIProvider` (ADR 003): nenhum código de domínio conhece o
 * fornecedor. Ver docs/adr/005-email-transacional.md.
 *
 * REGRA INVIOLÁVEL: **nenhum e-mail carrega conteúdo clínico.**
 *
 * E-mail trafega e repousa em servidor de terceiro, fora do nosso controle e
 * fora da RLS. Nome de paciente, prontuário, plano terapêutico, transcrição,
 * anotação de sessão e resumo de IA nunca entram aqui — nem em assunto, nem em
 * corpo, nem em anexo. O que pode ir é convite, aviso de conta e link para a
 * aplicação, onde a autorização de verdade acontece.
 */

export type Destinatario = {
  readonly email: string;
  /** Nome de exibição. Opcional — nunca é nome de paciente. */
  readonly nome?: string;
};

export type Mensagem = {
  readonly para: Destinatario;
  readonly assunto: string;
  /**
   * Corpo em texto puro. **Obrigatório**, não opcional.
   *
   * Cliente que não renderiza HTML precisa de alternativa legível, e um e-mail
   * só-HTML pontua pior em filtro de spam — o que importa quando a mensagem é
   * um convite que precisa chegar.
   */
  readonly texto: string;
  readonly html: string;
};

export type ResultadoEnvio =
  | { readonly enviado: true; readonly id: string | null }
  | { readonly enviado: false; readonly motivo: string };

export interface EmailProvider {
  /** Nome do adaptador, para log e para a interface saber o que dizer. */
  readonly nome: string;
  /**
   * `true` quando o envio de fato sai daqui para o mundo.
   *
   * O adaptador de console é `false`, e é isso que faz a tela de convite
   * continuar mostrando o link para repasse manual em desenvolvimento.
   */
  readonly entregaDeVerdade: boolean;

  enviar(mensagem: Mensagem): Promise<ResultadoEnvio>;
}
