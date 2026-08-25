# IMPLEMENTATION_PLAN.md — Serenità

Plano de execução em fases, derivado da auditoria integral do Figma (`docs/FIGMA_AUDIT.md`) e das decisões registradas em `docs/DESIGN_DECISIONS.md`.

**Método por fase** (prompt-mestre §69): inspecionar os frames relevantes → inspecionar a arquitetura existente → atualizar o plano → implementar a menor fatia vertical coerente → testar → comparar visualmente com o Figma → documentar → seguir.

**Fatias verticais, não camadas** (§70). Nada de "toda a UI primeiro, backend depois".

---

## Estado atual

| Fase              | Estado           |
| ----------------- | ---------------- |
| 0 — Discovery     | ✅ Concluída     |
| 1 — Foundation    | ✅ Concluída     |
| 2 — Design System | ✅ Concluída     |
| 3 — Auth          | ✅ Concluída     |
| 4 — Pacientes     | 🟡 Em andamento  |
| 5–12              | ⬜ Não iniciadas |

Projeto Supabase: `Serenita` — ref `bsaoujbfanluzggjvhfa`, região `us-west-2`.

---

## Fase 0 — Discovery ✅

- [x] Inspeção integral do Figma via MCP — 12 páginas mapeadas, 36 telas desktop, 12 tablet, 10 component sets, 28 rotas, 3 papéis, 4 fluxos
- [x] Inspeção do repositório — greenfield, sem código legado
- [x] `docs/FIGMA_AUDIT.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DESIGN_DECISIONS.md` — divergências registradas (18 até a Fase 2)
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

## Fase 1 — Foundation ✅

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
- [x] Migrations aplicadas no projeto Supabase `Serenita` (`bsaoujbfanluzggjvhfa`), RLS confirmada ativa nas 3 tabelas

**Definition of Done:** shell renderiza e bate com o frame `dashboard` (`6:40`); `/dev/components` acessível em dev e ausente em produção; migration aplica limpo com RLS ativa; os quatro comandos passam. **Atendido.**

### Verificação de conectividade em runtime ✅

_(Nota corrigida na Fase 3: a saída HTTPS para `*.supabase.co` nunca esteve
bloqueada — o endpoint responde 401, ou seja, é alcançável e apenas exige
chave. O que faltava eram as credenciais, não a rede.)_

**Exercitada de fato na Fase 3**, com a aplicação rodando contra o projeto
`bsaoujbfanluzggjvhfa` depois do provisionamento:

```
GET /api/health  ->  200
{"status":"ok","database":"reachable","rlsBlocksAnonymousRead":true}
```

Ou seja: o banco responde, e a RLS devolve **zero linhas** de `clinics` sem
sessão, mesmo havendo uma clínica gravada. Era a única afirmação da Fase 1 que
seguia sem comprovação.

Para repetir em outro ambiente, após `cp .env.example .env.local` e preencher
as chaves:

```bash
npm run dev
curl http://localhost:3000/api/health
```

---

## Fase 2 — Design System ✅

**Objetivo:** estabilizar a camada de componentes antes de criar dezenas de páginas (§58).

**Primitivos com component set no Figma** — spec medida em `FIGMA_AUDIT.md` §3:

- [x] Button — 4 variants × 3 sizes × 3 states + `focus-visible` e `loading` (#4), mais `cta` e `outline` que só existem nas telas (#16)
- [x] Input — 4 states
- [x] Badge — 5 types · Tag — 4 types · Avatar — 3 sizes
- [x] Card — 3 variants (#5)
- [x] TableRow — 3 states
- [x] Toast — 4 types, seguindo o design das telas (#15)
- [x] Modal — `<dialog>` nativo: focus trap, Escape e restauração de foco sem dependência

**Primitivos derivados de instâncias desenhadas nas telas** (#6):

- [x] EmptyState — `empty-states` (6:5957), com variação `positive`
- [x] ErrorState — `error-warning-states` (6:6173)
- [x] AlertBanner — banner de consentimento (6:6195), 3 tons
- [x] Skeleton / SkeletonList — `loading-sync-states` (6:6084), 3 tons quentes
- [x] TranscriptionProcessing · SyncProcessing · AIProcessing · AudioWaveform · MonoChip — (6:6121, 6:6142, 6:6149)
- [x] Tabs / TabLinks — `perfil-paciente` (6:783), com navegação por setas
- [x] IconButton — NotificationButton do TopBar (6:112)
- [x] Sheet — `interaction-states`, translateY + backdrop blur 16px em 400ms

**Primitivos por consistência**, sem instância no Figma (#6):

- [x] Textarea · Select · Checkbox · Switch · Tooltip
- [ ] MultiSelect · Radio · Popover · Dropdown · Pagination — sem uso ainda; entram na fase que os exigir

**Sistema e qualidade:**

- [x] Sistema de motion em `src/lib/motion.ts` — tokens, materialização, sheet, backdrop e alternativa reduzida
- [x] `prefers-reduced-motion` e `prefers-reduced-transparency` respeitados
- [x] Comportamento responsivo desktop/tablet nos componentes
- [x] Todo componente no `/dev/components`, com o node do Figma de origem
- [x] 34 testes unitários e de componente
- [x] **Auditoria de contraste WCAG AA no browser: 0 falhas** (era 93)

### Achados relevantes

- **Bug crítico de contraste** — `tailwind-merge` descartava classes de cor por causa da escala tipográfica; todo botão primário ficou com 1.79:1. Corrigido e coberto por teste de regressão (#18).
- **A paleta do Figma falha na regra de acessibilidade do próprio Figma** em 6 combinações. Correção mínima aplicada, sem inventar cor nova (#17).
- **Dois designs de Toast conflitantes** no arquivo; seguimos as telas (#15).

**Definition of Done:** cada componente bate com o Figma, tem states, responsivo, acessibilidade, tipos, não duplica outro e está no playground. **Atendido.**

---

## Fase 3 — Auth + Multi-tenancy 🟡

### Fatia 1 — Entrar e sair ✅

- [x] `/login` (`6:9`) — senha + magic link, com tratamento de credencial inválida, link expirado e rate limit
- [x] Recuperação de senha (`/recuperar`) — resposta idêntica com ou sem conta, para não enumerar e-mails
- [x] `proxy.ts` — renovação de sessão e checagem otimista de rota. **No Next 16 `middleware.ts` foi deprecado e renomeado**
- [x] `server/auth/session.ts` — camada de acesso a dados, memoizada com `cache()`, como checagem real
- [x] Persistência de sessão entre abas — cookie renovado pelo proxy a cada requisição
- [x] Redirect para `/dashboard` com sessão válida, e `?next=` preservando o destino
- [x] Proteção contra open redirect em `next`, com teste dedicado
- [x] `(app)/layout.tsx` deixou de usar perfil placeholder — vem do banco, sob RLS
- [x] `clinics` · `profiles` · enum de papéis _(já na Fase 1)_
- [x] Funções `current_clinic_id()` · `current_profile_role()` · `is_clinical_role()` _(já na Fase 1)_
- [x] Policies de RLS em toda tabela sensível _(Fase 1, endurecidas em `20260824180540`)_
- [x] `policy.ts` por domínio, compartilhado UI/server _(já na Fase 1)_
- [x] **Suíte de testes de RLS** (ADR 001) — 19 cenários em `supabase/tests/rls.sql`

### Fatia 2 — Contas e clínicas ✅

- [x] Onboarding de clínica (`6:5213`) — passo 1 de 9, o único desenhado (#25). O wizard **completa** a clínica, não a cria (#26)
- [x] Migration `20260824190106` — `clinics.cnpj/address/phone/kind/onboarding_completed_at` e a tabela `invitations` com RLS
- [x] Validação de CNPJ por módulo 11, com máscara na apresentação
- [x] Usuários e permissões (`6:4989`) — tabela de membros, troca de papel, shell de Configurações
- [x] Convite de membro — token de 32 bytes, só o SHA-256 no banco. **Envio de e-mail pendente de provedor** (#27)
- [x] `audit_log` gravado em onboarding, convite, revogação e troca de papel
- [x] Consentimento de cookies LGPD na primeira visita (#30)
- [x] Suíte de RLS ampliada para `invitations` — 28 cenários
- [x] Assets de marca incorporados: `public/brand/logomark.png` e `login-glow.png`, com teste e2e de carregamento
- [ ] Google OAuth no botão do frame 6:9 _(depende da credencial da Fase 5 — ver `DESIGN_DECISIONS` #20)_

### Fatia 3 — o que falta para a Fase 3 fechar ⬜

- [x] **Script de provisionamento** de clínica + primeiro admin (`scripts/provisionar-clinica.mts`), por `service_role`, com `--dry-run` e desfazimento em ordem inversa. Documentado em `supabase/seed/README.md`
- [x] Aceite de convite — `/convite/[token]` pública, com `accept_invitation` (`SECURITY DEFINER`, atômica) e `invitation_preview`. O token sozinho não basta: exige sessão com o e-mail do convite (#32)
- [x] Link do convite devolvido ao admin para repasse manual, enquanto não há provedor de e-mail (#27)
- [x] Envio de e-mail transacional — porta `EmailProvider` com adaptadores `console` (padrão) e `resend`, mensagem de convite e ADR 005
- [ ] SMTP próprio no Supabase Auth (magic link e recuperação de senha) — **configuração de painel, não código**: Authentication → Emails → SMTP Settings. O SMTP padrão do Supabase tem limite baixo e não serve para produção
- [x] Perfil profissional — `/configuracoes/perfil`, para todos os papéis (#34)
- [x] Arquivar e restaurar membro, no modal de permissões (#35)
- [x] Guard de papel movido da raiz de `/configuracoes` para cada seção — a raiz é Admin mas `/configuracoes/calendario` é Psychologist (#33)
- [x] Migration `20260824204026` — `is_clinical_role()` devolve `false`, nunca `NULL`, para perfil arquivado
- [x] Suíte de RLS em 36 cenários, executada inteira contra o banco real
- [ ] E-mail dos membros ativos na tabela (#29) — decisão de modelo pendente

---

## Fase 4 — Pacientes 🟡

### Fatia 1 — Cadastro e lista ✅

- [x] Migration `20260824205417` — `patients` com `display_code` PAC-### sequencial por clínica, CPF único, e a RLS que separa os papéis
- [x] Migration `20260824230536` — `patient_clinical_intake`, a **primeira tabela clínica de verdade**: só o psicólogo designado (#36)
- [x] `/pacientes` (`6:496`) — busca por nome/CPF/telefone com debounce 300ms, filtro por status e estado na URL
- [x] `/pacientes/novo` (`6:5292`) — CPF validado por módulo 11 e exibido mascarado
- [x] Ação Arquivar/Reativar, que o frame pressupõe mas não desenha (#40)
- [x] Suíte de RLS em 50 cenários, com 14 sobre paciente e conteúdo clínico

### Fatia 2 — Perfil do paciente ✅

- [x] `/pacientes/[id]` (`6:783`) — banner com dados cadastrais e **sete** tabs, não cinco (#41)
- [x] Aba Resumo com conteúdo por papel: clínico para o psicólogo designado, cadastral para admin e secretária (#42)
- [x] Paciente inexistente e invisível sob RLS respondem igual — 404 nos dois casos (#43)
- [x] "Ver Perfil" na lista (6:617)
- [x] E2E com sessão compartilhada: um login para a suíte, eliminando falha por limite de taxa

### Fatia 3 — Prontuário ✅

- [x] Migration `20260824235613` — `patient_clinical_record` (quatro seções do frame, como enum) e `patient_clinical_record_revision`, append-only e escrita só por trigger (#48)
- [x] A "Demanda Inicial" saiu do acolhimento e virou seção do prontuário: uma fonte de verdade só (#47)
- [x] `/pacientes/[id]/prontuario` (`6:1658`) — quatro cartões colapsáveis, o corpo é o campo (#46)
- [x] Autosave com piso de 500ms e teto de 30s, estados `Salvando · Salvo às HH:MM · Erro ao salvar` anunciados por `aria-live`
- [x] Guard + RLS: quem não é o psicólogo designado vê o motivo, não uma tela vazia — com e2e pela URL direta
- [x] Suíte de RLS em 65 cenários, com 17 sobre prontuário e histórico
- [x] Migration `20260825102728` — `execute` revogado nas funções de trigger, que nasciam expostas como RPC pelo default privileges do Supabase
- [ ] **Persistência local do rascunho** (ARCHITECTURE §15) — vai junto com o editor de sessão, onde a exposição é maior
- [ ] Editor de registro clínico (`6:1562`) — é `/sessao/[id]/registro`, depende de `sessions` (Fase 6)

### Fatia 4 — Plano terapêutico ⬜

- [ ] `/pacientes/[id]/plano` (`6:1782`) — objetivos com progresso, sob a mesma RLS clínica
- [ ] Autosave, reaproveitando `src/lib/autosave.ts`

### Fatia 5 — O que fecha a Fase 4 ⬜

- [ ] `/pacientes/[id]/sessoes` (`6:1919`) — depende de `sessions` (Fase 6)
- [ ] Edição de cadastro do paciente (botão "Editar Dados" do banner 6:843)
- [ ] Exclusão de paciente com diálogo de confirmação + aprovação de admin

Já estabelecido nas fatias anteriores:

- [x] `/pacientes/[id]` (`6:783`) com **sete** tabs, não cinco (#41)
- [x] `patients.display_code` — `PAC-###` por clínica (#12)
- [x] RLS: dado clínico só para o psicólogo designado — **admin não vê**. Cada tabela clínica nova repete o padrão; `patient_clinical_record` foi a terceira

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

> O necessário para subir hoje já está em `docs/DEPLOY.md` — variáveis,
> allowlist de redirect do Supabase, SMTP e verificação pós-deploy. Esta fase
> cobre o resto.

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
