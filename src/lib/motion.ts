/**
 * Sistema de motion — `10 — DEV HANDOFF / Motion Tokens` (12:895) e as cinco
 * spec sheets de `01 — FOUNDATIONS`.
 *
 * Os valores aqui espelham os tokens de `src/styles/tokens.css`. CSS puro cobre
 * transições simples; este módulo existe para o que precisa de `motion`
 * (Framer Motion): matched geometry, sheets e materialização.
 *
 * Princípio do arquivo: "Elementos não desaparecem — transformam-se."
 * E a regra dura: **transições lineares são estritamente proibidas.**
 */

/** Curvas de easing, como tuplas para o `motion`. */
export const EASE = {
  /** `cubic-bezier(0.2, 0, 0, 1)` — a curva padrão do sistema. */
  standard: [0.2, 0, 0, 1],
  /** `cubic-bezier(0.32, 0.72, 0, 1)` — sheets e telas cheias. */
  sheet: [0.32, 0.72, 0, 1],
  /** `cubic-bezier(0.16, 1, 0.3, 1)` — desaceleração natural das spec sheets. */
  outExpo: [0.16, 1, 0.3, 1],
} as const;

/** Durações em segundos, como o `motion` espera. */
export const DURATION = {
  fast: 0.15,
  standard: 0.25,
  slow: 0.35,
  sheet: 0.4,
  springSubtle: 0.2,
} as const;

/**
 * Transições nomeadas, uma por token de motion.
 *
 * | Token                | Uso                                            |
 * | -------------------- | ---------------------------------------------- |
 * | fast                 | hover, tooltip, checkbox, transição de cor     |
 * | standard             | modal, dropdown, expansão de card              |
 * | slow                 | transição de página, matched geometry          |
 * | sheet                | bottom sheet, modo sessão                      |
 * | spring               | micro-interações com resposta física           |
 */
export const TRANSITIONS = {
  fast: { duration: DURATION.fast, ease: EASE.standard },
  standard: { duration: DURATION.standard, ease: EASE.standard },
  slow: { duration: DURATION.slow, ease: EASE.standard },
  sheet: { duration: DURATION.sheet, ease: EASE.sheet },
  spring: { type: "spring", stiffness: 100, damping: 10 },
} as const;

/**
 * Materialização — "novos elementos surgem de forma não linear: iniciam
 * pequenos e translúcidos, progredindo para a escala e opacidade finais"
 * (`motion-principles`). 250ms.
 */
export const MATERIALIZE = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: TRANSITIONS.standard,
} as const;

/**
 * Bottom sheet — `interaction-states`: `translateY(100% → 0%)` com o fundo
 * desfocando de 0 para 16px, em 400ms spring.
 */
export const SHEET = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: TRANSITIONS.sheet,
} as const;

/** Backdrop que acompanha o sheet. */
export const BACKDROP = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: TRANSITIONS.standard,
} as const;

/**
 * Alternativa sob `prefers-reduced-motion` — `accessibility-reduce-motion`:
 * "Desativa saltos físicos e escalas. Substitui por fade de opacidade simples
 * (200ms)."
 */
export const REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;
