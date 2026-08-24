import "server-only";

import { montarConvite } from "@/domain/email/convite";
import type { Role } from "@/domain/auth/types";
import { obterEmailProvider } from "@/server/providers/email";

/**
 * Envia o e-mail de convite.
 *
 * Devolve o que aconteceu em vez de lançar: a essa altura o convite **já está
 * gravado**, e derrubar a Server Action por falha de e-mail transformaria um
 * convite válido em erro para quem convidou. Quem chama decide o que dizer.
 */
export async function enviarConvite(dados: {
  para: string;
  clinica: string;
  papel: Role;
  link: string;
  expiraEm: Date;
  convidadoPor?: string;
}): Promise<
  { entregue: true; porEmail: boolean } | { entregue: false; motivo: string }
> {
  const provider = obterEmailProvider();
  const { assunto, texto, html } = montarConvite({
    clinica: dados.clinica,
    papel: dados.papel,
    link: dados.link,
    expiraEm: dados.expiraEm,
    convidadoPor: dados.convidadoPor,
  });

  const resultado = await provider.enviar({
    para: { email: dados.para },
    assunto,
    texto,
    html,
  });

  if (!resultado.enviado) {
    console.error("[email] falha ao enviar convite", {
      provider: provider.nome,
      motivo: resultado.motivo,
    });
    return { entregue: false, motivo: resultado.motivo };
  }

  // `entregaDeVerdade` é false no adaptador de console: o e-mail foi "aceito",
  // mas ninguém o recebeu. Quem chama precisa saber para continuar mostrando o
  // link de repasse manual.
  return { entregue: true, porEmail: provider.entregaDeVerdade };
}
