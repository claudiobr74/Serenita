import { ROTULO_PAPEL } from "@/domain/auth/membros";
import type { Role } from "@/domain/auth/types";

/**
 * Mensagem de convite.
 *
 * Função **pura**: recebe dados, devolve assunto, texto e HTML. Nenhum I/O, o
 * que a torna testável sem fornecedor e sem rede.
 *
 * O que entra aqui é deliberadamente pouco — nome da clínica, papel, link e
 * prazo. Nada clínico, por regra da porta de e-mail (ADR 005): e-mail repousa
 * em servidor de terceiro, fora da RLS.
 *
 * Sem imagem e sem CSS externo: cliente de e-mail bloqueia imagem remota por
 * padrão, e um convite que chega quebrado não é aceito. O estilo é inline e
 * mínimo, com as cores dos tokens em hex porque e-mail não tem variável CSS.
 */

export type DadosDoConvite = {
  readonly clinica: string;
  readonly papel: Role;
  readonly link: string;
  readonly expiraEm: Date;
  /** Quem convidou. Omitido quando não se sabe. */
  readonly convidadoPor?: string;
};

/** Tokens do design system, em hex — e-mail não resolve `var()`. */
const COR = {
  fundo: "#fbf9f6",
  cartao: "#ffffff",
  borda: "#eae6df",
  textoPrimario: "#1f2421",
  textoSecundario: "#5d625e",
  textoTerciario: "#8a8f8a",
  acao: "#3a4f43",
} as const;

function formatarData(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

/** Escapa para HTML. Nome de clínica é entrada de usuário e vai no corpo. */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function montarConvite(dados: DadosDoConvite): {
  assunto: string;
  texto: string;
  html: string;
} {
  const papel = ROTULO_PAPEL[dados.papel];
  const prazo = formatarData(dados.expiraEm);
  const quem = dados.convidadoPor ? ` por ${dados.convidadoPor}` : "";

  const assunto = `Convite para ${dados.clinica} no Serenità`;

  const texto = [
    `Você foi convidada${quem} para ${dados.clinica} como ${papel}.`,
    "",
    "Para aceitar, abra o link abaixo:",
    dados.link,
    "",
    `O convite vale até ${prazo}.`,
    "",
    "Você precisará entrar com este mesmo endereço de e-mail — o link sozinho não dá acesso.",
    "",
    "Se você não esperava este convite, ignore esta mensagem.",
    "",
    "— Serenità",
  ].join("\n");

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:${COR.fundo};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="background:${COR.cartao};border:1px solid ${COR.borda};border-radius:16px;padding:32px;">
          <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:${COR.textoPrimario};">Serenit&agrave;</p>

          <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:${COR.textoPrimario};">
            Voc&ecirc; foi convidada${escapar(quem)} para <strong>${escapar(dados.clinica)}</strong> como <strong>${escapar(papel)}</strong>.
          </p>

          <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:${COR.textoSecundario};">
            O convite vale at&eacute; ${escapar(prazo)}.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background:${COR.acao};border-radius:8px;">
                <a href="${escapar(dados.link)}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:600;color:${COR.fundo};text-decoration:none;">Aceitar convite</a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;line-height:20px;color:${COR.textoSecundario};">
            Voc&ecirc; precisar&aacute; entrar com este mesmo endere&ccedil;o de e-mail &mdash; o link sozinho n&atilde;o d&aacute; acesso.
          </p>

          <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:${COR.textoTerciario};word-break:break-all;">
            Se o bot&atilde;o n&atilde;o funcionar, copie: ${escapar(dados.link)}
          </p>

          <p style="margin:24px 0 0;font-size:12px;line-height:18px;color:${COR.textoTerciario};">
            Se voc&ecirc; n&atilde;o esperava este convite, ignore esta mensagem.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { assunto, texto, html };
}
