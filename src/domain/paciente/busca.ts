import { apenasDigitos } from "./cpf";

/**
 * Normaliza o termo de busca.
 *
 * A Fase 4 exige busca por **nome, CPF ou telefone**. São formatos diferentes:
 * nome é texto livre, CPF e telefone são dígitos que o usuário digita com ou
 * sem máscara.
 *
 * Buscar `111.444.777-35` contra uma coluna que guarda `11144477735` não casa.
 * Então detectamos a intenção pelo conteúdo: se o que sobra depois de remover
 * não-dígitos é substancial, tratamos como documento e comparamos por dígitos.
 */
export type TermoDeBusca =
  | { readonly tipo: "vazio" }
  | { readonly tipo: "texto"; readonly valor: string }
  | {
      readonly tipo: "digitos";
      readonly valor: string;
      readonly texto: string;
    };

/** A partir de 3 dígitos vale tentar como documento; abaixo disso é ruído. */
const MINIMO_DE_DIGITOS = 3;

export function interpretarBusca(
  entrada: string | null | undefined,
): TermoDeBusca {
  const texto = (entrada ?? "").trim();
  if (texto.length === 0) return { tipo: "vazio" };

  const digitos = apenasDigitos(texto);

  // Só é documento se **a maior parte** do que foi digitado for dígito. Assim
  // "Ana 2" continua sendo busca por nome, e "111.444" vira busca por CPF.
  const ehDocumento =
    digitos.length >= MINIMO_DE_DIGITOS &&
    digitos.length >= texto.replace(/\s/g, "").length - 4;

  if (ehDocumento) return { tipo: "digitos", valor: digitos, texto };
  return { tipo: "texto", valor: texto };
}

/**
 * Escapa os curingas do `LIKE`/`ILIKE`.
 *
 * Sem isto, buscar por `%` casaria com todo mundo, e `_` com qualquer
 * caractere — o usuário veria resultado errado sem entender por quê.
 */
export function escaparCuringa(valor: string): string {
  return valor.replace(/[\\%_]/g, (c) => `\\${c}`);
}
