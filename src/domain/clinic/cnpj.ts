/**
 * CNPJ — normalização, validação e máscara.
 *
 * O frame 6:5237 exibe `00.000.000/0001-00`, mas o banco guarda só dígitos
 * (constraint `clinics_cnpj_formato`). A máscara é da apresentação.
 *
 * A validação é a oficial da Receita: dois dígitos verificadores por módulo 11.
 * Vale a pena porque um CNPJ inválido só apareceria muito depois, num recibo ou
 * documento emitido (Fases 9 e 10), quando já seria caro corrigir.
 */

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function mascararCnpj(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 14);
  if (d.length !== 14) return valor;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Dígito verificador por módulo 11, com os pesos da Receita. */
function digitoVerificador(base: string, pesos: readonly number[]): number {
  const soma = base
    .split("")
    .reduce((acc, char, i) => acc + Number(char) * pesos[i]!, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export function cnpjValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 14) return false;

  // Sequências repetidas (00000000000000, 11111111111111...) passam no módulo
  // 11 mas não são CNPJ.
  if (/^(\d)\1{13}$/.test(d)) return false;

  const dv1 = digitoVerificador(d.slice(0, 12), PESOS_1);
  if (dv1 !== Number(d[12])) return false;

  const dv2 = digitoVerificador(d.slice(0, 13), PESOS_2);
  return dv2 === Number(d[13]);
}
