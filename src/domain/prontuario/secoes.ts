/**
 * Seções do prontuário — frame `prontuario` (6:1658).
 *
 * O frame desenha quatro cartões colapsáveis, nesta ordem. A ordem não é
 * arbitrária: é a ordem de leitura clínica, de quem é o paciente até a
 * hipótese diagnóstica. Por isso o banco guarda a seção como enum, e não como
 * texto livre — UI e schema discordarem sobre quais seções existem seria um
 * jeito silencioso de perder registro.
 */

export const SECOES_DO_PRONTUARIO = [
  "demographic_identification",
  "initial_complaint",
  "clinical_family_history",
  "initial_diagnostic_assessment",
] as const;

export type SecaoDoProntuario = (typeof SECOES_DO_PRONTUARIO)[number];

export const ROTULO_SECAO: Record<SecaoDoProntuario, string> = {
  demographic_identification: "Identificação Demográfica",
  initial_complaint: "Demanda Inicial",
  clinical_family_history: "História Clínica e Familiar",
  initial_diagnostic_assessment: "Avaliação Diagnóstica Inicial",
};

/**
 * Texto de apoio dentro do campo vazio.
 *
 * O frame só mostra seções preenchidas, então não há placeholder desenhado.
 * Sem ele, porém, um prontuário novo seriam quatro caixas idênticas e mudas —
 * e o que se escreve em cada uma é justamente o que distingue as seções.
 * Ver docs/DESIGN_DECISIONS.md #44.
 */
export const EXEMPLO_SECAO: Record<SecaoDoProntuario, string> = {
  demographic_identification:
    "Idade, estado civil, ocupação, com quem mora, escolaridade.",
  initial_complaint: "O que trouxe o paciente, nas palavras dele.",
  clinical_family_history:
    "Histórico de tratamentos, medicação em uso, antecedentes familiares.",
  initial_diagnostic_assessment:
    "Hipótese diagnóstica, instrumentos aplicados, encaminhamentos.",
};

/**
 * Quais seções chegam abertas.
 *
 * No frame, as duas primeiras estão com chevron para cima e corpo visível; as
 * duas últimas, para baixo e sem corpo. Reproduzimos isso — com uma exceção
 * adiante, na página: seção preenchida abre, porque esconder conteúdo já
 * escrito seria pior do que divergir do estado inicial do desenho.
 */
export const ABERTA_POR_PADRAO: ReadonlySet<SecaoDoProntuario> = new Set([
  "demographic_identification",
  "initial_complaint",
]);

/** Limite por seção. Não há spec no Figma — ver docs/DESIGN_DECISIONS.md #45. */
export const LIMITE_DA_SECAO = 20_000;
