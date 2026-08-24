# Serenità

Plataforma clínica SaaS para psicólogos e clínicas de psicologia.

Multi-tenant, integrada nativamente ao Google Calendar, com IA sob controle
profissional e conformidade HIPAA/LGPD.

---

## Fontes de verdade

| O quê                                | Onde                                                              |
| ------------------------------------ | ----------------------------------------------------------------- |
| UI, UX, componentes, estados, motion | **Figma** — arquivo `Serenità`, file key `G0wRhYCZJWVOfTJdjPofCl` |
| Arquitetura, segurança, dados        | `docs/ARCHITECTURE.md` e `docs/adr/`                              |
| O que construir e em que ordem       | `IMPLEMENTATION_PLAN.md`                                          |

**O Figma vence para UI/UX.** Não redesenhe: não altere layouts, espaçamentos,
tipografia, cores, hierarquia, navegação, estados ou interações por preferência
pessoal.

A exceção é segurança e integridade de dados, que vencem sobre o Figma — sempre
com a divergência registrada em `docs/DESIGN_DECISIONS.md`.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 ·
Supabase (PostgreSQL, Auth, Storage, RLS) · Vitest · Playwright · Vercel

---

## Começando

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev
```

| Comando             | O que faz                   |
| ------------------- | --------------------------- |
| `npm run dev`       | Servidor de desenvolvimento |
| `npm run build`     | Build de produção           |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | `tsc --noEmit`              |
| `npm run test`      | Vitest                      |
| `npm run test:e2e`  | Playwright                  |
| `npm run format`    | Prettier                    |

### Rotas de desenvolvimento

`/dev/components` — playground de design tokens e componentes, para comparação
lado a lado com o Figma. Indisponível em produção.

---

## Estrutura

```
src/
  app/           Rotas (App Router)
  components/
    ui/            Primitivos do design system
    domain/        Componentes de domínio
    shell/         AppShell, Sidebar, TopBar
  domain/        Núcleo puro — tipos, schemas, policies, regras de negócio
  server/        Só servidor — Supabase, serviços, providers
  lib/           Utilitários genéricos
  styles/        tokens.css — camada centralizada de design tokens

supabase/
  migrations/    Migrations versionadas — única fonte de verdade do schema
  seed/          Seed de desenvolvimento, apenas dados fictícios

e2e/             Testes Playwright
docs/            Documentação e ADRs
```

Regras de dependência em `docs/ARCHITECTURE.md` §3.

---

## Regras que não se negociam

- **Nenhum hex hardcoded em componente.** Use tokens semânticos de
  `src/styles/tokens.css`.
- **RLS aplicada desde a primeira migration.** A UI nunca é mecanismo de
  segurança.
- **`admin` não acessa conteúdo clínico.** Exigência de compliance da RBAC
  Matrix, mais restritiva que o padrão da indústria.
- **Nenhum conteúdo clínico vai para o Google Calendar.** Apenas iniciais do
  paciente no título do evento.
- **IA nunca escreve no prontuário.** Todo artefato passa por revisão
  profissional: `generated → review → accepted/edited/rejected → record`.
- **Transcrição não é registro clínico.** São entidades distintas.
- **A `service_role` key nunca vai para o browser.**
- **Conteúdo clínico nunca aparece em URL, log, analytics ou error tracking.**

---

## Documentação

| Documento                                              | Conteúdo                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`docs/FIGMA_AUDIT.md`](docs/FIGMA_AUDIT.md)           | Auditoria integral do Figma — foundations, componentes, rotas, RBAC, fluxos, estados, responsivo, motion |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)         | Módulos, camadas, multi-tenancy, autorização, providers, governança de IA                                |
| [`docs/DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) | Contradições e lacunas do Figma, e como foram resolvidas                                                 |
| [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)     | Plano por fases, com Definition of Done                                                                  |
| [`docs/adr/`](docs/adr/)                               | Decisões arquiteturais                                                                                   |

### ADRs

1. [Multi-tenancy por `clinic_id` com RLS](docs/adr/001-multi-tenancy.md)
2. [Google Calendar como calendário](docs/adr/002-google-calendar-source-of-truth.md)
3. [Abstração de fornecedor de IA](docs/adr/003-ai-provider-abstraction.md)
4. [Arquitetura de transcrição e áudio](docs/adr/004-transcription-architecture.md)

---

## Estado atual

**Fase 1 — Foundation.** Tokens, app shell, estrutura e ferramental prontos. As
telas de produto são entregues nas fases seguintes; rotas ainda não implementadas
exibem um marcador explícito que nomeia a fase responsável.

Ver `IMPLEMENTATION_PLAN.md`.
