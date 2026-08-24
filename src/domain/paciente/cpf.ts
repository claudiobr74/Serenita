/**
 * CPF — normalização, validação e máscara.
 *
 * O banco guarda só dígitos (constraint `patients_cpf_formato`); a máscara
 * `000.000.000-00` é da apresentação, como no CNPJ da clínica.
 *
 * A validação é a oficial: dois dígitos verificadores por módulo 11. Num
 * cadastro de paciente ela importa mais do que parece — CPF é chave de
 * identificação, entra em documento e recibo (Fases 9 e 10), e um erro de
 * digitação só apareceria muito depois.
 */

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function mascararCpf(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);
  if (d.length !== 11) return valor;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * CPF parcialmente oculto, para exibição em lista.
 *
 * `03 — PATTERNS` exige CPF mascarado na tela do paciente. Mantemos os três
 * últimos dígitos antes do verificador, que é o suficiente para conferir a
 * pessoa sem expor o documento inteiro a quem passa pela tela.
 */
export function ocultarCpf(valor: string | null): string {
  const d = apenasDigitos(valor ?? "");
  if (d.length !== 11) return "—";
  return `•••.•••.${d.slice(6, 9)}-${d.slice(9)}`;
}

function digitoVerificador(base: string, pesoInicial: number): number {
  const soma = base
    .split("")
    .reduce((acc, char, i) => acc + Number(char) * (pesoInicial - i), 0);
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function cpfValido(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 11) return false;

  // Sequências repetidas (00000000000, 11111111111...) passam no módulo 11 e
  // são o caso que uma implementação ingênua deixa entrar.
  if (/^(\d)\1{10}$/.test(d)) return false;

  if (digitoVerificador(d.slice(0, 9), 10) !== Number(d[9])) return false;
  return digitoVerificador(d.slice(0, 10), 11) === Number(d[10]);
}
