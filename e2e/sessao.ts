import { join } from "node:path";

/** Onde o estado autenticado é gravado. Fica fora do git — ver .gitignore. */
export const ARQUIVO_DE_SESSAO = join(
  process.cwd(),
  ".playwright",
  "sessao.json",
);

/** `true` quando há credencial para exercitar os fluxos autenticados. */
export const TEM_CREDENCIAL = Boolean(
  process.env.E2E_EMAIL && process.env.E2E_SENHA,
);
