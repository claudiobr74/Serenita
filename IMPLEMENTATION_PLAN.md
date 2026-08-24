# IMPLEMENTATION_PLAN.md — Serenità

Plano de execução em fases, derivado da auditoria integral do Figma (`docs/FIGMA_AUDIT.md`) e das decisões registradas em `docs/DESIGN_DECISIONS.md`.

**Método por fase** (prompt-mestre §69): inspecionar os frames relevantes → inspecionar a arquitetura existente → atualizar o plano → implementar a menor fatia vertical coerente → testar → comparar visualmente com o Figma → documentar → seguir.

**Fatias verticais, não camadas** (§70). Nada de "toda a UI primeiro, backend depois".

---

## Estado atual

| Fase           | Estado                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| 0 — Discovery  | ✅ Concluída                                                            |
| 1 — Foundation | ✅ Concluída, exceto a aplicação da migration — ver bloqueador na Fase 1 |
| 2–12           | ⬜ Não iniciadas                                                        |

---

## Fase 0 — Discovery ✅

- [x] Inspeção integral do Figma via MCP — 12 páginas mapeadas, 36 telas desktop, 12 tablet, 10 component sets, 28 rotas, 3 papéis, 4 fluxos
- [x] Inspeção do repositório — greenfield, sem código legado
- [x] `docs/FIGMA_AUDIT.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DESIGN_DECISIONS.md` — 14 divergências registradas
- [x] `docs/adr/001` … `004`
- [x] `IMPLEMENTATION_PLAN.md`

### Blockers e decisões

**P0 — nenhum.**

**P1 — resolvidos com o usuário:**

- Contradição sidebar clara/escura e famílias tipográficas → seguir as 36 telas (`DESIGN_DECISIONS` #1)
- Versões de stack e acoplamento a fornecedor de IA → versões atuais + `AIProvider` (#11)
- Modelo de dados → `clinics`/`profiles` do Dev Handoff (#10)

**P1 — resolvidos por evidência:**

- Largura de sidebar 240/260/280 → 260px desktop, 56px rail tablet (#2)
- Item "Sessões" sem rota → criar `/sessoes` como índice (#3)

**P2 — adiados, com fase designada:** primitivos sem component set (Fase 2, #6) · máquina de estados de transcrição (Fase 6, #8) · telas mobile inexistentes (Fase 11, #9) · `patients.display_code` (Fase 4, #12)

**Credenciais ainda necessárias** (não bloqueiam Fases 1–4): Google OAuth client (Fase 5) · chave de fornecedor de IA (Fase 7) · Twilio (Fase 10) · fornecedor de transcrição (Fase 6)

---

## Fase 1 — Foundation 🚧

**Objetivo:** base sobre a qual as telas possam ser construídas com fidelidade, sem retrabalho.

- [x] Next.js 16 · App Router · React 19 · TypeScript `strict`
- [x] ESLint · Prettier
- [x] Vitest + Testing Library · Playwright
- [x] Estrutura de diretórios orientada a domínio
- [x] Camada centralizada de design tokens (`src/styles/tokens.css`) — cores, tipografia, espaçamento, radius, sombra, motion
- [x] Fontes: Newsreader · Instrument Sans · JetBrains Mono
- [x] `.env.example` com toda variável documentada, separando pública de server-only
- [x] Migration inicial `clinics`/`profiles`/`audit_log` com RLS + funções de autorização
- [x] Clientes Supabase (server/browser) + validação de env com Zod
- [x] App Shell — Sidebar 260px (rail 56px em tablet) + TopBar 72px, fiel às telas
- [x] `/dev/components` — playground, apenas em development
- [x] Quality gate: `lint` · `typecheck` · `test` · `build` verdes
- [x] QA visual do Dashboard contra o frame `6:40`, em desktop (1440×1024) e tablet (1194×834)
- [ ] **Aplicar a migration num projeto Supabase real** — bloqueado, ver abaixo

**Definition of Done:** shell renderiza e bate com o frame `dashboard` (`6:40`); `/dev/components` acessível em dev e ausente em produção; migration aplica limpo com RLS ativa; os quatro comandos passam.

### 🔴 Bloqueador — projeto Supabase não criado

A organização `Macedotech Org` atingiu o **limite de 2 projetos gratuitos ativos**
(`Tesseli` e `Anestflow`). A criação do projeto `Serenita` foi recusada:

> *"The following organization members have reached their maximum limits for the
> number of active free projects… (2 project limit). To continue, these users will
> need to either delete, pause or upgrade one or more of these projects."*

Nenhum projeto existente foi pausado ou removido — são recursos do usuário e a ação
é destrutiva.

**Ações possíveis, em ordem de preferência:**

1. Fazer upgrade da organização para um plano pago.
2. Pausar um projeto existente que não esteja em uso.
3. Criar o projeto `Serenita` numa outra organização Supabase.

A migration `20260824000001_clinics_and_profiles.sql` já está escrita e é a fonte
de verdade do schema — assim que houver projeto, ela é aplicada sem alteração.

Isto **não bloqueia** a Fase 2 (Design System), que não depende de banco. Bloqueia
a Fase 3 (Auth + Multi-tenancy) em diante.

---

## Fase 2 — Design System

**Objetivo:** estabilizar a camada de componentes antes de criar dezenas de páginas (§58).

**Primitivos com component set no Figma** — spec medida em `FIGMA_AUDIT.md` §3:

- [ ] Button — 4 styles × 3 sizes × 3 states + `focus-visible` e `loading` (`DESIGN_DECISIONS` #4)
- [ ] Input — 4 states
- [ ] Badge — 5 types · Tag — 4 types · Avatar — 3 sizes
- [ ] Card — 3 variants (#5)
- [ ] TableRow — 3 states
- [ ] Toast — 4 types
- [ ] Modal

**Primitivos derivados de instâncias desenhadas em telas** (#6): Tabs · Skeleton · EmptyState · ErrorState · Search · Command Palette · IconButton · Sheet/Drawer · Checkbox · Switch

**Primitivos por consistência**, sem instância no Figma (#6): Textarea · Select · MultiSelect · Radio · Tooltip · Popover · Dropdown · Pagination

- [ ] Sistema de motion — tokens + matched geometry + `prefers-reduced-motion`
- [ ] Comportamento responsivo desktop/tablet
- [ ] Todo componente no `/dev/components` com variants, states e sizes

**DoD por componente** (§77): bate com o Figma · tem states · tem responsivo · tem acessibilidade · tem tipos · não duplica outro · está no playground.

---

## Fase 3 — Auth + Multi-tenancy

- [ ] `/login` (`6:9`) — magic link + senha, tratamento de erro (credencial inválida, link expirado, rate limit)
- [ ] Recuperação de senha — e-mail em até 30s
- [ ] Persistência de sessão entre abas
- [ ] Redirect para `/dashboard` com sessão válida
- [ ] Consentimento de cookies LGPD na primeira visita
- [ ] `clinics` · `profiles` · enum de papéis
- [ ] Funções `current_clinic_id()` · `current_role()` · `is_clinical_role()`
- [ ] Policies de RLS em toda tabela sensível
- [ ] `policy.ts` por domínio, compartilhado UI/server
- [ ] Onboarding de clínica (`6:5213`)
- [ ] Usuários e permissões (`6:4989`)
- [ ] **Suíte de testes de RLS** (ADR 001)

---

## Fase 4 — Pacientes

- [ ] `/pacientes` (`6:496`) — busca por nome/CPF/telefone com debounce 300ms, filtro por status, ordenação
- [ ] `/pacientes/novo` (`6:5292`) — CPF validado e exibido mascarado
- [ ] `/pacientes/[id]` (`6:783`) — tabs Overview · Prontuário · Plano · Timeline · Documentos
- [ ] `patients.display_code` — `PAC-###` por clínica (#12)
- [ ] `/pacientes/[id]/prontuario` (`6:1658`) e editor (`6:1562`)
- [ ] `/pacientes/[id]/plano` (`6:1782`)
- [ ] `/pacientes/[id]/timeline` (`6:1919`)
- [ ] Autosave 30s / debounce 500ms com badge "Salvo"
- [ ] RLS: dado clínico só para o psicólogo designado — **admin não vê**
- [ ] Exclusão de paciente com diálogo de confirmação + aprovação de admin

---

## Fase 5 — Google Calendar

- [ ] OAuth Google, refresh token criptografado
- [ ] Seleção de calendário (`6:5260`) e configurações (`6:4841`)
- [ ] `/agenda` semanal (`6:290`) · `/agenda/diaria` (`6:3990`) · `/agenda/mensal` (`6:4196`)
- [ ] Criar (`6:5448`) e editar consulta (`6:5586`)
- [ ] Drag-and-drop para remarcar, com sync
- [ ] Cores por status: confirmado verde · pendente âmbar · cancelado cinza
- [ ] Detecção de conflito de horário
- [ ] Sync bidirecional por webhook + `syncToken`, idempotente
- [ ] Recorrência · cancelamento · atualizações externas · estado `conflict`
- [ ] Google Meet para sessões online
- [ ] **Teste: nenhum campo clínico jamais sai para o Google** (ADR 002)

---

## Fase 6 — Sessão clínica

O fluxo principal do produto. Precisa de UX excelente (§22).

- [ ] `/sessao/preparar/[id]` (`6:936`) — histórico + insights de IA em até 3s
- [ ] `/sessao/[id]` (`6:1427`) — full-screen, timer `hh:mm:ss` persistente entre refreshes
- [ ] Notas rich text durante a sessão
- [ ] `TranscriptionProvider` + máquina de estados (ADR 004)
- [ ] Upload de áudio direto/chunked para Storage
- [ ] `/sessao/[id]/pos` (`6:1499`) — debrief
- [ ] `/sessao/[id]/registro` (`6:1562`) — registro clínico, criptografado
- [ ] Recuperação de estado após queda do browser
- [ ] `/sessoes` — índice (#3)

---

## Fase 7 — IA

- [ ] `AIProvider` + `OpenAIAdapter` (ADR 003)
- [ ] `SessionPreparationService` · `DebriefService` · `ClinicalSummaryService`
- [ ] Saída estruturada validada com Zod
- [ ] Fluxo de revisão: generated → review → accepted/edited/rejected → record
- [ ] Marcação visual de conteúdo não revisado
- [ ] Gate de consentimento server-side
- [ ] Nível de confiança perceptível sem depender de cor
- [ ] Resumo pós-sessão em até 10s
- [ ] Audit log de toda interação com IA

---

## Fase 8 — Supervisor + Conhecimento

- [ ] `/conhecimento` (`6:2431`) — PDF, artigo, livro, protocolo, guideline, nota, material próprio
- [ ] Pipeline: ingestion → parsing → chunking → embedding → retrieval
- [ ] `/supervisor` (`6:2261`) — chat com seletor de contexto de paciente
- [ ] Atribuição de fonte com deep-link para Conhecimento
- [ ] Rótulo "Sugestão — não substitui supervisão clínica" em toda resposta
- [ ] Histórico persistido por contexto de paciente
- [ ] Resposta em até 5s para consultas padrão

---

## Fase 9 — Documentos + Consentimentos

- [ ] `/documentos` (`6:2907`) — templates com substituição de variáveis
- [ ] Tipos: Atestado · Declaração · Relatório · Encaminhamento · Recibo
- [ ] Geração de PDF com cabeçalho da clínica e assinatura digital
- [ ] Versionamento, finalização, histórico de auditoria
- [ ] `/consentimentos` (`6:3202`) — `draft · sent · viewed · signed · refused · expired · revoked`
- [ ] Versão exata assinada preservada — **histórico nunca sobrescrito**
- [ ] Captura de assinatura: nome + timestamp + IP
- [ ] Fluxo de revogação com trilha de auditoria
- [ ] Storage em bucket criptografado

---

## Fase 10 — Financeiro + Pendências

- [ ] `/financeiro` (`6:2657`) — fatura auto-gerada de sessão concluída
- [ ] Status: Pendente · Pago · Atrasado · Cancelado
- [ ] Recibo em PDF com marca da clínica
- [ ] Receita mensal com comparação mês a mês
- [ ] Histórico de pagamento no perfil do paciente
- [ ] Export CSV/Excel
- [ ] `/pendencias` (`6:3418`) — fila por prioridade
- [ ] `/indicadores` (`6:4519`)
- [ ] `/auditoria` (`6:5713`)
- [ ] Twilio para lembretes por SMS

---

## Fase 11 — Hardening

- [ ] QA visual tela a tela contra o Figma (§47–48) — prioridade em Dashboard, Agenda, Perfil Paciente, Preparar Sessão, Modo Sessão, Debrief, Supervisor IA
- [ ] Suíte completa de testes de RLS
- [ ] Testes de segurança: IDOR · cross-tenant · escalação de privilégio · injection · URL assinada vazada · webhook inseguro
- [ ] QA responsivo desktop + tablet
- [ ] Auditoria de acessibilidade WCAG AA
- [ ] Performance: TTI ≤ 3s em 4G · bundle · hidratação · N+1
- [ ] Estados de erro completos em toda tela
- [ ] Observabilidade com scrubbing de dado clínico
- [ ] Mobile conforme regras textuais (#9)
- [ ] E2E dos fluxos obrigatórios de §46

---

## Fase 12 — Produção

- [ ] Projeto Vercel + ambiente de produção
- [ ] Supabase de produção + migrations
- [ ] Sentry · Vercel Analytics · PostHog
- [ ] Estratégia de backup
- [ ] Release checklist
- [ ] Documentação final revisada

---

## Requisitos globais — toda tela, toda fase

Transcritos de `10 — DEV HANDOFF / Acceptance Criteria`:

- Contraste WCAG AA (4.5:1 texto, 3:1 UI)
- Navegável por teclado
- Responsivo em Desktop (≥1280px) e Tablet (768–1279px)
- Todas as cores por token semântico — **nenhum hex hardcoded**
- Skeleton no fetch inicial
- Error boundary com retry
- **RLS aplicada — nenhum controle de acesso apenas client-side**
- `prefers-reduced-motion` respeitado
- TTI ≤ 3s em 4G
- Audit log em todo create/update/delete de dado sensível

**DoD de tela** (§78): bate com o Figma · conectada ao backend real da fase · loading · empty · error · permission · responsivo · acessibilidade · testes.

**DoD de feature** (§79): UI + backend + autorização + banco + validação + erros + testes + documentação + QA visual.
