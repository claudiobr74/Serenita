/**
 * Tradução dos erros de autenticação para mensagens de produto.
 *
 * O Supabase devolve mensagens em inglês e voltadas a quem desenvolve
 * ("Invalid login credentials"). A tela precisa de português e de um tom que
 * não culpe o usuário.
 *
 * Regra de segurança: **nunca revelar se um e-mail existe**. Credencial
 * inválida e e-mail inexistente devem produzir a MESMA mensagem, senão o
 * formulário vira um oráculo de enumeração de contas.
 */

export type AuthErrorCode =
  | "credenciais_invalidas"
  | "email_nao_confirmado"
  | "link_expirado"
  | "limite_de_tentativas"
  | "senha_fraca"
  | "indisponivel";

export const MENSAGEM: Record<AuthErrorCode, string> = {
  credenciais_invalidas:
    "E-mail ou senha incorretos. Verifique e tente novamente.",
  email_nao_confirmado:
    "Confirme seu e-mail antes de entrar. Reenviamos o link para sua caixa de entrada.",
  link_expirado:
    "Este link expirou ou já foi usado. Solicite um novo para continuar.",
  limite_de_tentativas:
    "Muitas tentativas seguidas. Aguarde alguns minutos antes de tentar de novo.",
  senha_fraca: "A senha precisa de ao menos 8 caracteres.",
  indisponivel:
    "Não foi possível concluir agora. Tente novamente em instantes.",
};

/**
 * Classifica o erro do Supabase.
 *
 * Casa por `code` quando existe — é estável — e cai para o texto apenas como
 * último recurso, porque a mensagem muda entre versões.
 */
export function classificarErro(erro: {
  code?: string;
  status?: number;
  message?: string;
}): AuthErrorCode {
  const code = erro.code ?? "";
  const texto = (erro.message ?? "").toLowerCase();

  if (erro.status === 429 || code === "over_request_rate_limit") {
    return "limite_de_tentativas";
  }
  if (code === "invalid_credentials" || texto.includes("invalid login")) {
    return "credenciais_invalidas";
  }
  if (code === "email_not_confirmed" || texto.includes("email not confirmed")) {
    return "email_nao_confirmado";
  }
  if (
    code === "otp_expired" ||
    texto.includes("expired") ||
    texto.includes("invalid or has expired")
  ) {
    return "link_expirado";
  }
  if (code === "weak_password" || texto.includes("password should be")) {
    return "senha_fraca";
  }
  return "indisponivel";
}
