# ARCHITECTURE.md — Serenità

Como o Serenità permanece seguro, escalável e sustentável.

> O Figma define **como o Serenità deve parecer e se comportar** (ver `FIGMA_AUDIT.md`).
> Este documento define **tudo o mais**.

---

## 1. Stack

| Camada    | Escolha                                                             | Versão |
| --------- | ------------------------------------------------------------------- | ------ |
| Framework | Next.js, App Router                                                 | 16.x   |
| UI        | React, Server Components por padrão                                 | 19.x   |
| Linguagem | TypeScript `strict`                                                 | 5.x    |
| Styling   | Tailwind CSS (config CSS-first via `@theme`)                        | 4.x    |
| Motion    | `motion` (Framer Motion)                                            | —      |
| Ícones    | `lucide-react`                                                      | —      |
| Backend   | Supabase — PostgreSQL, Auth, Storage, Realtime, RLS, Edge Functions | —      |
| Validação | Zod, compartilhada client/server                                    | —      |
| Testes    | Vitest (unit/component) + Playwright (E2E)                          | —      |
| Hosting   | Vercel (frontend) + Supabase Cloud (backend)                        | —      |

Divergências deliberadas em relação ao Tech Stack do Figma estão em `DESIGN_DECISIONS.md` #11.

---

## 2. Princípios

1. **Enforcement server-side.** A UI nunca é mecanismo de segurança. Toda autorização é aplicada em três camadas independentes: UI → server → RLS. Nenhuma delas confia na anterior.
2. **Organização por domínio.** O código é agrupado por domínio de negócio, não por tipo de arquivo.
3. **Componentes visuais não contêm lógica de negócio.** Um componente recebe dados e emite intenções. Ele não consulta o banco, não decide permissão e não conhece o fornecedor de IA.
4. **Fornecedores externos atrás de abstração.** IA, transcrição, SMS e calendário são acessados por interfaces do domínio, nunca por SDK direto na lógica de negócio.
5. **Nada de identificadores hardcoded.** Nem `clinic_id`, nem `user_id`, nem permissão, nem credencial.
6. **Dado clínico é altamente sensível.** Exposição mínima, menor privilégio, auditável, nunca em URL, log, analytics, error tracking ou Google Calendar.

---

## 3. Estrutura de diretórios

```
src/
  app/                        Rotas (App Router). Fino: só composição e data fetching.
    (auth)/                     login, recuperação
    (onboarding)/               wizard de primeira execução
    (app)/                      área autenticada — usa o AppShell
      dashboard/
      agenda/
      pacientes/
      sessao/
      supervisor/
      conhecimento/
      financeiro/
      documentos/
      consentimentos/
      pendencias/
      indicadores/
      configuracoes/
      auditoria/
    (session)/                  Modo Sessão — full-screen, sem AppShell
    dev/components/             Playground. Só em development.
    api/                        Route handlers (webhooks, OAuth callbacks)

  components/
    ui/                       Primitivos do design system. Sem domínio, sem data fetching.
    domain/                   Componentes de domínio (PatientRow, SessionCard, AIReview…).
    shell/                    AppShell, Sidebar, TopBar, SidebarRail.

  domain/                     Núcleo. Zero dependência de React, Next ou Supabase.
    <dominio>/
      types.ts                  Tipos e enums do domínio
      schema.ts                 Schemas Zod (compartilhados client/server)
      policy.ts                 Regras de autorização puras e testáveis
      <dominio>.ts              Regras de negócio puras

  server/                     Só executa no servidor. Nunca importado por Client Component.
    supabase/                   Clientes (server, browser, admin), tipos gerados
    auth/                       Sessão, perfil atual, guards
    services/                   Serviços de aplicação por domínio
    providers/                  Adapters de fornecedores externos
      ai/                         AIProvider + OpenAIAdapter
      transcription/              TranscriptionProvider
      calendar/                   GoogleCalendarProvider
      notifications/              TwilioProvider
    audit/                      Escrita no audit log

  lib/                        Utilitários genéricos, sem domínio (cn, format, datas)
  styles/                     tokens.css — camada centralizada de design tokens

supabase/
  migrations/                 Migrations versionadas. Única fonte de verdade do schema.
  seed/                       Seed de desenvolvimento. Apenas dados fictícios.

e2e/                          Testes Playwright
docs/                         Esta documentação
  adr/                        Architecture Decision Records
```

### Regras de dependência

```
app/  →  components/  →  domain/
  ↓                         ↑
server/  ────────────────────
  ↓
providers/  →  SDKs externos
```

- `domain/` não importa nada de `app/`, `components/`, `server/` ou de SDKs. É puro e testável em isolamento.
- `components/ui/` não importa de `domain/` nem de `server/`.
- `components/domain/` pode importar de `domain/` (tipos) e de `components/ui/`. **Nunca** de `server/`.
- `server/` é a única camada que fala com Supabase e com fornecedores externos.
- Nenhum Client Component importa de `server/`. A fronteira é atravessada por Server Actions e props serializáveis.

---

## 4. Server vs. Client

**Server Component é o padrão.** `"use client"` é exceção, justificada por: estado local, efeitos, listeners de evento, ou APIs de browser.

| Precisa de…                                    | Onde vive                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Leitura de dados para render inicial           | Server Component                                                                  |
| Mutação                                        | Server Action, em `server/services/`                                              |
| Estado de formulário, timer de sessão, editor  | Client Component                                                                  |
| Estado de servidor em cliente (refetch, cache) | TanStack Query, apenas onde o Figma exige refresh (`staleTime: 30s` no Dashboard) |

Client Components ficam nas folhas da árvore. Uma tela não vira `"use client"` inteira por causa de um botão.

---

## 5. Multi-tenancy

Raiz de tenancy: **`clinics`**. Toda tabela organizacional carrega `clinic_id`.

```
clinics
   └── profiles (id = auth.uid, clinic_id, role)
   └── patients (clinic_id, psychologist_id)
          └── sessions (clinic_id, patient_id, psychologist_id)
                 └── clinical_records
          └── treatment_plans
          └── consents
   └── invoices · documents · tasks · audit_log
```

**Nunca se confia em filtro do frontend.** O isolamento é garantido por RLS, com funções auxiliares em `SECURITY DEFINER` que leem o perfil do JWT:

- `current_clinic_id()` → `clinic_id` do perfil autenticado
- `current_role()` → papel do perfil autenticado
- `is_clinical_role()` → `current_role() = 'psychologist'`

Toda política se ancora em `current_clinic_id()`, nunca num id vindo do cliente. Ver `docs/AUTHORIZATION.md` e `docs/DATABASE.md`.

---

## 6. Autorização (RBAC)

Três papéis, conforme a matriz de `04 — INFORMATION ARCHITECTURE`:

| Papel          | Escopo                                                                  |
| -------------- | ----------------------------------------------------------------------- |
| `psychologist` | Acesso clínico completo aos **próprios** pacientes                      |
| `admin`        | Administração da clínica. **Sem acesso a conteúdo clínico**             |
| `secretary`    | Agenda, cadastro de paciente, financeiro básico. **Sem acesso clínico** |

> O ponto mais importante e mais fácil de errar: **`admin` não vê prontuário.** É mais restritivo que o padrão da indústria e é exigência de compliance do próprio Figma. Precisa de teste de RLS dedicado.

Três camadas de aplicação, independentes:

1. **UI** — o que está fora do escopo do papel não é renderizado (não é desabilitado). Conveniência, não segurança.
2. **Server** — todo Server Action e route handler chama um guard de `domain/<dominio>/policy.ts` antes de qualquer efeito.
3. **RLS** — última linha. Mesmo que 1 e 2 falhem, o Postgres recusa.

As regras de `policy.ts` são funções puras, sem I/O, testadas unitariamente e reutilizadas pela UI e pelo servidor — a mesma regra, uma definição só.

---

## 7. Abstração de fornecedores

Nenhum serviço de domínio conhece um fornecedor concreto.

```ts
// server/providers/ai/types.ts
export interface AIProvider {
  complete(req: CompletionRequest): Promise<CompletionResult>;
  stream(req: CompletionRequest): AsyncIterable<CompletionChunk>;
}
```

Serviços de aplicação são específicos por caso de uso — **nunca um `askAI()` universal** (§26 do prompt-mestre):

`SessionPreparationService` · `DebriefService` · `ClinicalSummaryService` · `SupervisorService` · `KnowledgeService`

Cada um monta seu próprio prompt, define seu próprio schema de saída (validado com Zod) e aplica seus próprios gates de consentimento. O `AIProvider` só transporta.

O mesmo padrão vale para `TranscriptionProvider`, `CalendarProvider` e `NotificationProvider`. Ver ADR 003 e 004.

---

## 8. Governança de IA clínica

Conteúdo gerado por IA **nunca** entra no prontuário automaticamente.

```
AI generated  →  professional review  →  accepted / edited / rejected  →  clinical record
```

- Todo artefato de IA é persistido com estado de revisão e fica visualmente marcado como não revisado até a decisão do profissional.
- A aceitação é registrada em `audit_log`.
- Fluxos dependentes de IA verificam consentimento **server-side**. Botão desabilitado não é gate — o serviço recusa.
- O Supervisor IA é consultivo: nunca apresenta conclusão como certeza clínica, sempre exibe nível de confiança e fontes. Indicadores de confiança são perceptíveis **sem depender de cor** (ícone + texto), por exigência de acessibilidade do Figma.
- Transcrição **não é** registro clínico. São entidades distintas, com ciclos de vida distintos.

---

## 9. Google Calendar

O Serenità **não** tem agenda independente. Ver ADR 002.

| Serenità é fonte de verdade para         | Google Calendar é fonte de verdade para      |
| ---------------------------------------- | -------------------------------------------- |
| Relação com o paciente                   | Existência e horário do evento no calendário |
| Status clínico da consulta               | Disponibilidade                              |
| Confirmação, preparo, estado da sessão   | Ciclo de vida do evento                      |
| Relação com pagamento e workflow clínico | Google Meet                                  |

**Privacidade — regra dura.** Nada de conteúdo clínico sai para o Google. O `summary` do evento leva **apenas as iniciais do paciente**. Sem diagnóstico, hipótese, evolução, notas, conteúdo de sessão ou plano terapêutico. Essa regra é aplicada num único ponto de serialização (`server/providers/calendar/`), coberto por teste.

Sincronização idempotente por `google_event_id` + `extendedProperties.session_id`. Estados: `synced · pending · syncing · error · conflict · disconnected`.

---

## 10. Áudio

Arquivos de áudio **nunca** trafegam em query string, JSON grande ou base64 por API comum.

```
Client  →  upload direto/chunked (URL assinada, curta duração)  →  Supabase Storage  →  processamento
```

Limites de serverless são premissa de projeto, não descoberta tardia.

---

## 11. Validação

Um schema Zod por operação, em `domain/<dominio>/schema.ts`, **compartilhado** entre client e server.

- Client: valida para UX (feedback inline no blur, conforme `03 — PATTERNS`).
- Server: valida **obrigatoriamente**. Dado vindo do navegador nunca é confiável.

O tipo do domínio é inferido do schema (`z.infer`), então validação e tipo não divergem.

---

## 12. Erros

Erros de domínio são tipados e mapeados para mensagens de produto. O usuário nunca vê `500`, `Postgres error`, `JWT invalid` ou `undefined`.

| Situação                      | Apresentação (definida em `03 — PATTERNS`) |
| ----------------------------- | ------------------------------------------ |
| Erro recuperável              | Toast                                      |
| Falha de submit de formulário | Banner inline                              |
| 500 / falha de rede           | Estado de página inteira com retry         |

Detalhe técnico vai para o log estruturado, com `clinic_id` e correlação — **nunca** com conteúdo clínico.

`try/catch` vazio é proibido.

---

## 13. Audit log

`audit_log` é **insert-only**: sem UPDATE, sem DELETE, garantido por policy de RLS.

Registra: `clinic_id`, ator, ação, tipo e id da entidade, timestamp, IP, metadados seguros.

Eventos obrigatórios: atualização e finalização de registro clínico · mudança de consentimento · mudança de permissão · arquivamento de paciente · finalização de documento · aceitação de conteúdo de IA · acesso a dado sensível quando aplicável.

**Nunca** armazena conteúdo clínico bruto.

---

## 14. Soft delete

Registro clínico não é apagado silenciosamente. Entidades apropriadas usam `archived_at`, `archived_by` e `status`. Hard delete só onde a política do domínio permitir explicitamente.

---

## 15. Autosave

Onde o Figma exige (Prontuário, Plano Terapêutico): salvar a cada **30s**, com debounce de **500ms** em inputs de texto. Estados discretos: `Salvando · Salvo · Erro ao salvar`, com timestamp — e anunciados para leitores de tela.

As duas exigências se contradizem para quem digita sem parar: o debounce nunca fecha. `src/lib/autosave.ts` trata os 500ms como **piso** e os 30s como **teto**, com um único timer agendado para o menor dos dois — onde o teto conta desde que o texto ficou sujo e não é reiniciado pelas teclas seguintes.

Além do timer, a gravação é forçada ao sair do campo (`blur`) e ao esconder a aba (`visibilitychange`) — `beforeunload` não serve, porque não espera promessa.

Rascunho persiste localmente para sobreviver a queda de rede ou do browser. **Trabalho digitado pelo profissional não se perde.**

> **Ainda não implementado:** a persistência local do rascunho. O que existe hoje (teto de 30s, gravação no blur e ao esconder a aba) limita a perda a uma janela curta, mas não cobre queda do browser no meio da digitação. Chega junto com o editor de registro de sessão (Fase 6), onde a exposição é maior.

---

## 16. Design tokens

Camada única em `src/styles/tokens.css`, exposta ao Tailwind 4 por `@theme`.

A nomenclatura do Figma é preservada literalmente: `color/background/primary` → `--color-background-primary`. A correspondência Figma ↔ código é verificável linha a linha.

**Nenhum hex hardcoded em componente.** É requisito global de aceite do próprio Figma.

---

## 17. Motion

Tokens de duração e easing vivem no token layer. Implementação com `motion`.

Princípio: **objetos se transformam, não desaparecem.** Continuidade espacial, matched geometry (`layoutId`), materialização, morphing.

`prefers-reduced-motion` e `prefers-reduced-transparency` são respeitados; nenhuma funcionalidade depende de animação.

---

## 18. Observabilidade

Logging estruturado, error tracking e performance monitoring.

**Nunca** registrar áudio, transcrição bruta ou conteúdo clínico sensível sem justificativa explícita. Os payloads enviados a error tracking passam por scrubbing antes do envio.

---

## 19. Testes

| Camada      | Escopo                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `domain/` — regras de negócio, validadores, policies, utilitários                                                                                           |
| Component   | Primitivos e componentes de domínio críticos                                                                                                                |
| Integration | Supabase, auth, Google Calendar, serviços de IA e transcrição                                                                                               |
| E2E         | Playwright — fluxos obrigatórios (§46 do prompt-mestre)                                                                                                     |
| **RLS**     | Categoria própria: isolamento cross-tenant, secretary vs. clínico, **admin vs. clínico**, usuário sem membership, usuário removido, acesso por ID conhecido |

Ver `docs/TESTING.md`.
