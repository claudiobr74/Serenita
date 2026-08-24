# FIGMA_AUDIT.md — Serenità

Auditoria integral do arquivo Figma que serve de fonte de verdade para UI/UX.

**Arquivo:** `Serenità` — file key `G0wRhYCZJWVOfTJdjPofCl`
**Auditado em:** 2026-08-24
**Método:** inspeção estruturada via Figma MCP (`get_metadata`, `get_design_context`, `get_screenshot`). Nenhuma tela foi inferida a partir de screenshot isolado.

---

## 1. Mapa do arquivo

O Figma declara 12 páginas na página `00 — README`. As páginas reais e seus node IDs:

| Página                        | node ID        | Conteúdo real encontrado                                                        |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------- |
| 00 — README / PRODUCT RULES   | `6:8434`       | Regras de produto + navegação do arquivo                                        |
| 01 — FOUNDATIONS              | `6:8435`       | Motion (5 spec sheets), Color Palette, Typography, Spacing                      |
| 02 — COMPONENTS               | `6:8436`       | 10 componentes com variants                                                     |
| 03 — PATTERNS                 | `6:8437`       | 8 padrões de UI (form, validation, autosave, loading…)                          |
| 04 — INFORMATION ARCHITECTURE | `6:8438`       | Route Map (28 rotas) + RBAC Matrix (3 papéis)                                   |
| 05 — USER FLOWS               | `6:8439`       | 4 fluxos completos                                                              |
| 06 — DESKTOP                  | `0:1`          | **36 telas** a 1440×1024                                                        |
| 07 — TABLET                   | `6:8440`       | **12 telas** iPad a 1194×834                                                    |
| 08 — MOBILE                   | `6:8441`       | **VAZIA** — nenhuma tela desenhada                                              |
| 09 — INTERACTIVE PROTOTYPE    | não localizada | declarada como "future" no README                                               |
| 10 — DEV HANDOFF              | `6:8443`       | Stack, mapping, data model, a11y, responsive, GCal, motion, acceptance criteria |
| 99 — ARCHIVE                  | não localizada | —                                                                               |

> **Nota de método:** `get_metadata` sem `nodeId` lista apenas a página `00`. As demais foram alcançadas por acesso direto a node ID (IDs de página são sequenciais a partir de `6:8434`, exceto `06 — DESKTOP` que é a página original `0:1`).

---

## 2. Foundations

### 2.1 Cores — tokens semânticos

Extraídos de `Foundations / Color Palette` (`12:261`). O Figma já nomeia os tokens no formato `color/grupo/nome`.

**Backgrounds**

| Token                        | Hex       | Uso declarado                                    |
| ---------------------------- | --------- | ------------------------------------------------ |
| `color/background/primary`   | `#FFFFFF` | Cards, surfaces                                  |
| `color/background/secondary` | `#FBF9F6` | Page background                                  |
| `color/surface/hover`        | `#EAEFEA` | Hover states                                     |
| `color/surface/sidebar`      | `#1F2421` | Sidebar background — **ver DESIGN_DECISIONS #1** |

**Text**

| Token                  | Hex       | Uso                 |
| ---------------------- | --------- | ------------------- |
| `color/text/primary`   | `#1F2421` | Headings, body      |
| `color/text/secondary` | `#5D625E` | Secondary info      |
| `color/text/muted`     | `#8A8F8A` | Placeholders, hints |
| `color/text/inverse`   | `#FFFFFF` | Text on dark bg     |

**Actions**

| Token                       | Hex       | Uso                 |
| --------------------------- | --------- | ------------------- |
| `color/action/primary`      | `#3A4F43` | Primary CTA         |
| `color/action/primaryHover` | `#2D3E34` | Primary hover       |
| `color/action/secondary`    | `#EAE6DF` | Secondary button    |
| `color/action/danger`       | `#C2735A` | Destructive actions |

**Status**

| Token                  | Hex       | Uso               |
| ---------------------- | --------- | ----------------- |
| `color/status/success` | `#3A7D5C` | Success text/icon |
| `color/status/warning` | `#D6A374` | Warning text/icon |
| `color/status/error`   | `#C2735A` | Error text/icon   |
| `color/status/info`    | `#5B7FA6` | Info text/icon    |

**Tokens ausentes do quadro de Foundations mas usados de forma consistente nos componentes** (extraídos por `get_design_context`, documentados aqui para completar o sistema):

| Token derivado                | Hex       | Origem                                                                               |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------ |
| `color/border/default`        | `#EAE6DF` | Input, Card, Toast, TableRow, TopBar, Sidebar border                                 |
| `color/surface/muted`         | `#F0F1F0` | Input disabled, Badge neutral, Modal close button                                    |
| `color/action/secondaryHover` | `#DDD9D2` | Button Secondary Hover                                                               |
| `color/action/dangerHover`    | `#A8644E` | Button Danger Hover                                                                  |
| `color/status/successBg`      | `#E8F5EE` | Badge Success                                                                        |
| `color/status/warningBg`      | `#F8F1E9` | Badge Warning / Tag Financial                                                        |
| `color/status/errorBg`        | `#F9ECE8` | Badge Error                                                                          |
| `color/status/infoBg`         | `#EBF1F7` | Badge Info / Tag Calendar                                                            |
| `color/status/warningText`    | `#846447` | Badge Warning / Tag Financial (texto — mais escuro que `warning`, para contraste AA) |

### 2.2 Tipografia

**Conflito documentado (ver DESIGN_DECISIONS #1).** As páginas `00`/`01`/`02` declaram _"Font: Inter (all weights). No other typefaces."_; as 36 telas de `06 — DESKTOP` usam três famílias. **As telas prevalecem.**

| Papel                         | Família                | Uso observado nas telas                                                                 |
| ----------------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| Display / headings / numerais | **Newsreader** (serif) | Wordmark "Serenitá" 22px Bold; título de TopBar 24px Bold; valores de métrica 28px Bold |
| UI / body / labels            | **Instrument Sans**    | Nav labels 14px Medium/SemiBold; métricas label 13px SemiBold; body 14px Regular        |
| Mono                          | **JetBrains Mono**     | Atalhos de teclado (⌘K) 10px Regular                                                    |

Escala declarada em `Foundations / Typography` (`12:340`) — mantida como escala de tamanhos, com as famílias acima:

| Nome       | Tamanho / Linha | Peso     |
| ---------- | --------------- | -------- |
| Display    | 32 / 40         | Bold     |
| H1         | 24 / 32         | SemiBold |
| H2         | 20 / 28         | SemiBold |
| H3         | 18 / 24         | SemiBold |
| H4         | 16 / 22         | Medium   |
| Body       | 14 / 20         | Regular  |
| Body Small | 13 / 18         | Regular  |
| Caption    | 12 / 16         | Regular  |
| Overline   | 11 / 14         | Medium   |

### 2.3 Espaçamento

`Foundations / Spacing Scale` (`12:370`) — base 4px:

`space/1` 4 · `space/2` 8 · `space/3` 12 · `space/4` 16 · `space/6` 24 · `space/8` 32 · `space/10` 40 · `space/12` 48 · `space/16` 64

### 2.4 Radius

Não há quadro de radius em Foundations. Valores derivados dos componentes reais:

| Token         | Valor  | Onde                                                                      |
| ------------- | ------ | ------------------------------------------------------------------------- |
| `radius/xs`   | 4px    | KeyShortcut, ícone de nav item                                            |
| `radius/sm`   | 6px    | Button SM, Tag, Modal close button                                        |
| `radius/md`   | 8px    | Button MD, Input, NavItem, SearchField, SyncIndicator, NotificationButton |
| `radius/lg`   | 10px   | Button LG, Toast                                                          |
| `radius/xl`   | 12px   | Card                                                                      |
| `radius/2xl`  | 16px   | Modal, cards de métrica do dashboard                                      |
| `radius/full` | 9999px | Badge, Avatar                                                             |

### 2.5 Sombras

| Token       | Valor                           | Onde          |
| ----------- | ------------------------------- | ------------- |
| `shadow/sm` | `0px 2px 6px rgba(0,0,0,0.06)`  | Card Elevated |
| `shadow/md` | `0px 4px 8px rgba(0,0,0,0.08)`  | Toast         |
| `shadow/lg` | `0px 8px 16px rgba(0,0,0,0.12)` | Modal         |

### 2.6 Motion

De `10 — DEV HANDOFF / Motion Tokens` (`12:895`) e das 5 spec sheets de `01 — FOUNDATIONS`.

| Token                  | Duração | Easing                           | Uso                                               |
| ---------------------- | ------- | -------------------------------- | ------------------------------------------------- |
| `motion/fast`          | 150ms   | `cubic-bezier(0.2, 0, 0, 1)`     | Button hover, tooltip, checkbox, cor              |
| `motion/standard`      | 250ms   | `cubic-bezier(0.2, 0, 0, 1)`     | Modal, dropdown, sidebar hover, card expand       |
| `motion/slow`          | 350ms   | `cubic-bezier(0.2, 0, 0, 1)`     | Page transitions, matched geometry, route changes |
| `motion/sheet`         | 400ms   | `cubic-bezier(0.32, 0.72, 0, 1)` | Bottom sheets, full-screen modals, session mode   |
| `motion/spring-subtle` | 200ms   | `spring(1, 100, 10, 0)`          | Toggles, radios, bounces sutis                    |

Curvas alternativas citadas nas spec sheets: `ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`; `fluid-spring: damping 0.8, response 0.35s`.

**Princípios** (`01 — FOUNDATIONS / motion-principles`):

- **Continuidade espacial** (350ms) — elementos se transformam, não desaparecem.
- **Matched geometry** (spring) — elementos compartilhados mantêm identidade entre telas.
- **Materialização** (250ms) — novos elementos iniciam pequenos e translúcidos.
- **Morphing** (ease-out) — componentes correlacionados se transformam entre si.
- **Liquid Glass** — camadas de navegação como vidro translúcido sobre conteúdo clínico sólido.
- **Interruptibilidade** — toda animação é interrompível por novo gesto.
- **Transições lineares são proibidas.**

**Transições-chave desenhadas** (`key-transitions`):

1. Lista de pacientes → Perfil — 350ms matched geometry (container expande).
2. Card do dashboard → Preparar Sessão — 300ms elevate & morph.
3. Preparar → Modo Sessão — 400ms crossfade & materialize (elementos secundários recuam no eixo Z).

**Micro-interações** (`interaction-states`): hover = `shadow-lift 4px`; pressed = `scale(0.98)`; loading = spin infinito 1s; toggle = 150ms spring-back; checkbox = elastic pop `scale(0.6) → scale(1.0)`; bottom sheet = `translateY(100% → 0%)` + `backdrop-filter: blur(0 → 16px)` em 400ms spring.

**Redução de movimento** (`accessibility-reduce-motion`):

- `prefers-reduced-motion` → desativa saltos físicos e escalas; substitui por fade de opacidade 200ms.
- `prefers-reduced-transparency` → substitui backdrop-filter por fundo sólido (`#FFFFFF` ou `#FBF9F6`) com bordas marcadas.
- iPad: área mínima de toque 44pt; fechamento de sheets por arraste com velocidade vetorial.

### 2.7 Iconografia

Ícones lineares, stroke, tamanhos 16 / 18 / 20px. Nomenclatura idêntica ao **Lucide**: `home`, `calendar`, `users`, `message-circle`, `triangle-alert`, `credit-card`, `book-open`, `sparkles`, `file-text`, `chart-line`, `cog`, `search`, `bell`.

---

## 3. Inventário de componentes (`02 — COMPONENTS`)

Especificações extraídas via `get_design_context` sobre cada component set.

### Button (`12:147`) — 36 variants

- **Props:** `style` = Primary | Secondary | Ghost | Danger; `size` = SM | MD | LG; `state` = Default | Hover | Disabled.
- **Sizes:** SM `min-h 32 · px 12 · py 6 · radius 6 · text 13/18`; MD `min-h 40 · px 16 · py 8 · radius 8 · text 14/20`; LG `min-h 48 · px 24 · py 12 · radius 10 · text 16/22`.
- **Cores:** Primary `#3A4F43` → hover `#2D3E34`, texto branco. Secondary `#EAE6DF` → hover `#DDD9D2`, texto `#1F2421`. Ghost transparente → hover `#EAEFEA`, texto `#3A4F43`. Danger `#C2735A` → hover `#A8644E`, texto branco.
- **Disabled:** `opacity 40%`, cor de fundo do estado default.
- **Peso:** Medium em todos.
- **Ausente no Figma:** estado `loading` (existe só como spec de motion) e `focus-visible`. Ver DESIGN_DECISIONS #4.

### Input (`12:168`) — 4 states

- **Props:** `state` = Default | Focused | Error | Disabled.
- **Estrutura:** label acima (13px Medium `#1F2421`) → box → mensagem de erro. Gap 6px, largura de referência 320.
- **Box:** `h 40 · px 12 · py 10 · radius 8 · bg #FFFFFF`.
- **Borders:** Default `1px #EAE6DF`; Focused `2px #3A4F43`; Error `1px #C2735A`; Disabled `1px #EAE6DF` + `bg #F0F1F0`.
- **Placeholder:** 14px Regular `#8A8F8A`. **Erro:** 12px Regular `#C2735A`. **Disabled:** opacidade 60% no wrapper, label `#8A8F8A`.

### Badge (`12:179`) — 5 types

`px 10 · py 4 · radius full · texto 12px Medium`. Success `#E8F5EE`/`#3A7D5C` · Warning `#F8F1E9`/`#846447` · Error `#F9ECE8`/`#C2735A` · Info `#EBF1F7`/`#5B7FA6` · Neutral `#F0F1F0`/`#5D625E`.

### Tag (`12:249`) — 4 types

`px 8 · py 3 · radius 6 · texto 11px Medium · letter-spacing 0.3px`. Default `#F0F1F0`/`#5D625E` · Clinical `#EAEFEA`/`#3A4F43` · Financial `#F8F1E9`/`#846447` · Calendar `#EBF1F7`/`#5B7FA6`.

### Avatar (`12:186`) — 3 sizes

SM 32 · MD 40 · LG 56, todos `radius full`.

### Card (`12:196`) — 3 variants

`bg #FFFFFF · p 20 · gap 12 · radius 12`. Default e Outlined: `border 1px #EAE6DF`. Elevated: `shadow 0 2px 6px rgba(0,0,0,.06)`, sem borda. Título 16px SemiBold `#1F2421`; corpo 14/20 Regular `#5D625E`.

> Default e Outlined são visualmente idênticos no arquivo. Ver DESIGN_DECISIONS #5.

### SidebarNavItem (`12:206`) — 3 states

Definido para **sidebar escura**: `w 220 · px 12 · py 10 · radius 8 · gap 10`; Default texto `#C0C4C0`, ícone `#A0A5A0`; Active `bg rgba(58,79,67,.15)`, texto branco SemiBold, ícone branco; Hover `bg rgba(255,255,255,.08)`.
**Superado pelas telas reais** — ver DESIGN_DECISIONS #1 e a spec de AppShell na §5.

### TableRow (`12:219`) — 3 states

`w 800 · px 16 · py 12 · border-b 1px #EAE6DF`, 3 colunas flex iguais. Default `bg #FFFFFF` · Hover `bg #FBF9F6` · Selected `bg #EAEFEA`. Col 1 Medium `#1F2421`; cols 2-3 Regular `#5D625E`.

### Toast (`12:240`) — 4 types

`w 360 · px 16 · py 14 · radius 10 · bg #FFFFFF · border 1px #EAE6DF · shadow 0 4px 8px rgba(0,0,0,.08) · gap 12`. Barra de acento `4×24 · radius 2` colorida por tipo: Success `#3A7D5C` · Warning `#D6A374` · Error `#C2735A` · Info `#5B7FA6`. Título 14px SemiBold `#1F2421`; mensagem 13/18 Regular `#5D625E`.

### Modal (`12:250`)

`w 480 · p 24 · gap 20 · radius 16 · bg #FFFFFF · shadow 0 8px 16px rgba(0,0,0,.12)`. Header: título 18px SemiBold + close button `24×24 · radius 6 · bg #F0F1F0`. Separator `1px #EAE6DF`. Body 14/22 Regular `#5D625E`. Footer alinhado à direita, gap 12: Cancelar (Secondary MD) + Confirmar (Primary MD).

### Componentes exigidos pelo prompt-mestre e **ausentes** do Figma

Textarea, Select, MultiSelect, Checkbox, Radio, Switch, Tabs, Tooltip, Popover, Dropdown, Sheet, Drawer, Skeleton, EmptyState, ErrorState, Pagination, Search, Command Palette, IconButton.
Vários aparecem _desenhados dentro de telas_ (search/command palette em `command-palette-search`, tabs em `perfil-paciente`, skeletons em `loading-sync-states`) mas não como component set. Ver DESIGN_DECISIONS #6.

---

## 4. Padrões (`03 — PATTERNS`)

| Padrão                   | Regra                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout de formulário** | Coluna única para formulários simples; duas colunas para entrada densa (cadastro de paciente). Máx. 640px em coluna única. Labels **sempre acima** do input, nunca inline. |
| **Validação**            | Inline no `blur`. Erro = borda `#C2735A` + mensagem abaixo. Sucesso é **silencioso** (sem bordas verdes). Campos obrigatórios com asterisco sutil.                         |
| **Ações**                | Primária (Salvar/Confirmar) à direita; secundária (Cancelar) à esquerda dela. Ações destrutivas exigem diálogo de confirmação. Submit desabilitado durante envio.          |
| **Autosave**             | Prontuário e Plano Terapêutico salvam a cada **30s**. Badge "Salvo" com timestamp. Debounce de **500ms** em inputs de texto.                                               |
| **Busca e filtro**       | Input de busca no topo com ícone de lupa. Filtros como chips/popover. Filtros ativos como tags removíveis abaixo da busca. Link "Limpar filtros".                          |
| **Empty states**         | Ilustração + título + descrição + CTA. Ex.: "Nenhum paciente encontrado" + "Adicione seu primeiro paciente para começar" + `[+ Novo Paciente]`.                            |
| **Loading**              | Skeleton para carregamento inicial (imita o layout). Spinner apenas para updates in-place. **Nunca bloquear a página inteira** — só a área de conteúdo.                    |
| **Erros**                | Toast para erros recuperáveis. Banner inline para falha de submit. Página inteira de erro apenas para 500/rede, com botão de retry.                                        |

---

## 5. App Shell (extraído das telas reais)

Spec canônica, comum às 25 telas de `06 — DESKTOP` que possuem shell.

### Sidebar (`6:41`) — 260px

- `w 260 · bg #FFFFFF · border-r 1px #EAE6DF · p 24 · flex-col justify-between`.
- **Brand:** logomark 32×32 + wordmark "Serenitá" Newsreader Bold 22px `#1F2421`, gap 8. Espaço abaixo: 32.
- **NavItems:** coluna, gap 4, largura total. Cada item: `px 12 · py 10 · radius 8 · gap 12`, ícone 18px.
  - **Ativo:** `bg #EAEFEA · border 1px #EAE6DF`, label Instrument Sans SemiBold 14px `#3A4F43`.
  - **Inativo:** fundo e borda transparentes, label Instrument Sans Medium 14px — **ver DESIGN_DECISIONS #2**.
- **11 itens, nesta ordem:** Início · Agenda · Pacientes · Sessões · Pendências · Financeiro · Conhecimento · Supervisor IA · Documentos · Indicadores · Configurações.
- **Rodapé:** separador 1px + bloco de usuário (gap 16): avatar 40 `radius full` + nome 14px SemiBold `#1F2421` + clínica 12px Regular `#5D625E`, gap 2.

### TopBar (`6:100`) — 72px

- `bg #FFFFFF · border-b 1px #EAE6DF · px 32 · flex justify-between items-center`.
- **Título:** Newsreader Bold 24px `#1F2421` (contextual por rota — ex. "Hoje no Serenitá").
- **Ações** (gap 16):
  - **SearchField:** `w 280 · bg #FBF9F6 · border 1px #EAE6DF · radius 8 · px 16 · py 8 · gap 8`; ícone 16; placeholder Instrument Sans 14px `#5D625E`; KeyShortcut `bg #FFFFFF · border 1px #EAE6DF · radius 4 · px 6 · py 2`, JetBrains Mono 10px `#8A8F8A`.
  - **SyncIndicator:** `bg #EAEFEA · radius 8 · px 12 · py 8 · gap 6`; dot 6px; texto Instrument Sans Medium 13px `#3A4F43`.
  - **NotificationButton:** `40×40 · border 1px #EAE6DF · radius 8`, ícone 20.

### Área de conteúdo

`bg #FBF9F6`, padding 32. Cards de métrica: `bg #FFFFFF · border 1px #EAE6DF · radius 16 · p 20 · gap 12`; label 13px Instrument Sans SemiBold `#5D625E` + ícone 18; valor 28px Newsreader Bold `#1F2421`.

---

## 6. Rotas (`04 — INFORMATION ARCHITECTURE`)

28 rotas. Esta tabela **substitui** a arquitetura de rotas proposta no prompt-mestre (§11), conforme a instrução "adapte se o Figma definir arquitetura diferente".

| Rota                         | Tela                       | Auth    | Papéis           | Notas                             |
| ---------------------------- | -------------------------- | ------- | ---------------- | --------------------------------- |
| `/login`                     | Login                      | Público | All              | Supabase Auth, magic link + senha |
| `/onboarding`                | Onboarding Clínica         | Auth    | Admin            | Wizard de primeira execução       |
| `/onboarding/calendar`       | Onboarding Google Calendar | Auth    | Psychologist     | Fluxo Google OAuth                |
| `/dashboard`                 | Dashboard                  | Auth    | All              | KPIs, agenda resumida, pendências |
| `/agenda`                    | Agenda Semanal             | Auth    | All              | View padrão                       |
| `/agenda/diaria`             | Agenda Diária              | Auth    | All              | Blocos de horário                 |
| `/agenda/mensal`             | Agenda Mensal              | Auth    | All              | Visão de mês                      |
| `/pacientes`                 | Lista Pacientes            | Auth    | All              | Busca, filtro, ordenação          |
| `/pacientes/novo`            | Novo Paciente              | Auth    | Psych, Admin     | Formulário de criação             |
| `/pacientes/[id]`            | Perfil Paciente            | Auth    | Psych, Admin     | Detalhe com tabs                  |
| `/pacientes/[id]/prontuario` | Prontuário                 | Auth    | **Psychologist** | Registros clínicos                |
| `/pacientes/[id]/plano`      | Plano Terapêutico          | Auth    | **Psychologist** | Plano com objetivos               |
| `/pacientes/[id]/timeline`   | Timeline Sessões           | Auth    | **Psychologist** | Histórico de sessões              |
| `/sessao/preparar/[id]`      | Preparar Sessão            | Auth    | **Psychologist** | Preparo com insights de IA        |
| `/sessao/[id]`               | Modo Sessão                | Auth    | **Psychologist** | Full-screen, timer, notas         |
| `/sessao/[id]/pos`           | Pós-Sessão                 | Auth    | **Psychologist** | Resumo, análise de IA             |
| `/sessao/[id]/registro`      | Editor Registro            | Auth    | **Psychologist** | Editor rich text                  |
| `/supervisor`                | Supervisor IA              | Auth    | **Psychologist** | Chat de supervisão clínica        |
| `/conhecimento`              | Conhecimento               | Auth    | **Psychologist** | Base (DSM-5, CID, técnicas)       |
| `/financeiro`                | Financeiro                 | Auth    | Psych, Admin     | Faturas, pagamentos, receita      |
| `/documentos`                | Documentos                 | Auth    | Psych, Admin     | Templates, geração                |
| `/consentimentos`            | Consentimentos             | Auth    | Psych, Admin     | Gestão LGPD                       |
| `/pendencias`                | Pendências                 | Auth    | All              | Fila de tarefas com prioridades   |
| `/indicadores`               | Indicadores                | Auth    | Psych, Admin     | Dashboard analítico               |
| `/configuracoes`             | Configurações              | Auth    | **Admin**        | Config da clínica                 |
| `/configuracoes/calendario`  | Google Calendar Settings   | Auth    | Psychologist     | Config de sync                    |
| `/configuracoes/usuarios`    | Usuários/Permissões        | Auth    | **Admin**        | Gestão RBAC                       |
| `/auditoria`                 | Auditoria                  | Auth    | **Admin**        | Log de atividade                  |

**Divergência estrutural:** a sidebar tem um item **"Sessões"** que não corresponde a nenhuma rota do Route Map (as rotas de sessão são todas `/sessao/[id]/…`, sempre a partir de uma sessão concreta). Ver DESIGN_DECISIONS #3.

---

## 7. RBAC (`04 — INFORMATION ARCHITECTURE / RBAC Matrix`)

| Papel            | Descrição                                                                                                                                      | Acesso                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Psychologist** | Acesso clínico completo. Vê/edita **seus** pacientes, sessões e registros clínicos. Não gerencia configurações da clínica nem outros usuários. | Dashboard, Agenda, Pacientes (próprios), Sessões, Prontuário, Plano Terapêutico, Supervisor IA, Conhecimento, Financeiro (próprio), Documentos, Consentimentos, Pendências, Indicadores (próprios) |
| **Admin**        | Administrador da clínica. Acesso total a configurações, usuários e financeiro. **Não acessa registros clínicos** (compliance HIPAA/LGPD).      | Dashboard, Agenda (todas), Pacientes (todos, **sem clínico**), Financeiro (todos), Documentos, Consentimentos, Pendências, Indicadores (todos), Configurações, Usuários, Auditoria                 |
| **Secretary**    | Operação de recepção. Agendamento, cadastro de pacientes, financeiro básico. **Sem acesso clínico.**                                           | Dashboard (limitado), Agenda (ver/editar), Pacientes (**cadastro apenas**), Pendências, Financeiro (ver recibos)                                                                                   |

> Ponto crítico de segurança: **Admin não vê conteúdo clínico.** Isso é mais restritivo que o modelo usual de "admin vê tudo" e precisa ser aplicado em RLS, não só na UI.

---

## 8. Fluxos de usuário (`05 — USER FLOWS`)

### 8.1 Session Flow — fluxo clínico principal

1. **Agenda → Selecionar sessão** → `/agenda` (`6:290`)
2. **Preparar Sessão** — histórico, notas anteriores, insights de IA, objetivos do plano, notas de preparo → `/sessao/preparar/[id]` (`6:936`)
3. **Entrar em Modo Sessão** — "Iniciar Sessão", timer inicia, painel de notas abre, Google Meet auto-join se online → `/sessao/[id]` (`6:1427`)
4. **Durante a sessão** — notas rich text em tempo real, timer, acesso rápido a histórico e plano, IA escuta temas-chave (se habilitada)
5. **Encerrar sessão** — "Encerrar Sessão", timer para → `/sessao/[id]/pos` (`6:1499`)
6. **Resumo pós-sessão** — IA gera resumo, tópicos-chave, follow-ups sugeridos; profissional revisa e edita; avalia progresso
7. **Escrever registro clínico** — editor estruturado; evolução, observações, intervenções; **conteúdo criptografado ao salvar** → `/sessao/[id]/registro` (`6:1562`)
8. **Atualizar plano terapêutico** (opcional) → `/pacientes/[id]/plano` (`6:1782`)
9. **Agendar próxima sessão** — auto-sync Google Calendar, confirmação ao paciente → Criar Consulta (`6:5448`)

### 8.2 Patient Onboarding

Abrir formulário (`6:5292`) → preencher dados (CPF validado, contato de emergência, origem) → **consentimento LGPD assinado** com versão, IP e timestamp (`6:3202`) → agendar primeira consulta (`6:5448`) → perfil criado com badge "Novo" e empty states (`6:783`) → criar plano terapêutico após a primeira sessão (`6:1782`).

### 8.3 Clinic Setup (first-run)

Criar conta (magic link/senha, papel Admin) (`6:9`) → wizard de clínica: nome, logo, endereço, horários, duração padrão, formas de pagamento (`6:5213`) → conectar Google Calendar via OAuth, escolher calendário, config de sync bidirecional (`6:5260`) → convidar equipe com papéis RBAC via magic link (`6:4989`) → configurar notificações, templates, versões de consentimento, padrões financeiros (`6:4701`) → dashboard com empty states e CTAs guiados (`6:40`).

### 8.4 AI Supervisor Consultation

Abrir Supervisor IA (`6:2261`) → selecionar contexto do paciente (carrega histórico, plano, sessões recentes) → perguntar → **resposta com nível de confiança e fontes citadas (DSM-5, CID, literatura), rotulada como consultiva e não prescritiva** → deep-link para Conhecimento (`6:2431`) → opcionalmente incorporar ao plano terapêutico, com tudo registrado em audit log (`6:1782`).

---

## 9. Estados

Telas dedicadas em `06 — DESKTOP`:

| Frame                         | node ID  | Conteúdo                                                                                                                                                                                         |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `empty-states`                | `6:5957` | "Estados vazios modulares aplicados na interface geral" — 4 variações                                                                                                                            |
| `dialogs-confirmations`       | `6:6003` | Cancelar consulta (notifica paciente) · confirmar presença · **encerrar acompanhamento clínico** (escolha de modalidade) · **consentimento obrigatório para transcrição/resumo por IA**          |
| `loading-sync-states`         | `6:6071` | "Carregando Diretório…" · skeleton de métricas semanais · **"Analisando transcrição de áudio para extrair temas recorrentes e deveres de casa…"** · splash "Carregando ambiente clínico seguro…" |
| `error-warning-states`        | `6:6162` | Fluxos de falha tratada, banners de atenção, toasts de confirmação                                                                                                                               |
| `command-palette-search`      | `6:6231` | Busca global por teclado (⌘K)                                                                                                                                                                    |
| `notifications-communication` | `6:6305` | Avisos em lote e lembretes ativos para pacientes                                                                                                                                                 |

Cobertura de estados por categoria:

| Estado                 | Onde está definido                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Loading                | `loading-sync-states` + Patterns (skeleton vs spinner)                                                                   |
| Empty                  | `empty-states` + Patterns (ilustração + título + descrição + CTA)                                                        |
| Error                  | `error-warning-states` + Patterns (toast / banner inline / página)                                                       |
| Success                | Toast type=Success; validação de sucesso é **silenciosa** em formulários                                                 |
| Disabled               | Button state=Disabled (opacity 40%); Input state=Disabled                                                                |
| Permission denied      | **Não desenhado.** Ver DESIGN_DECISIONS #7                                                                               |
| Offline                | Dev Handoff / GCal: "Offline → mostrar dados em cache com timestamp de última sincronização"                             |
| Falha de sincronização | Dev Handoff / GCal: banner de reconexão na Agenda; fila de escrita em quota excedida; fallback para polling a cada 5 min |
| Processamento de IA    | `loading-sync-states` ("Analisando transcrição…"); Dev Handoff: resumo em até 10s                                        |
| Transcrição            | Implícito no estado de IA acima. **Máquina de estados não desenhada.** Ver DESIGN_DECISIONS #8                           |

---

## 10. Comportamento responsivo

Regras declaradas em `10 — DEV HANDOFF / Responsive Rules` (`12:840`), com os valores **medidos nas telas reais** onde divergem.

| Breakpoint            | Sidebar                                                             | Conteúdo                                                                                   | Navegação                                                             |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Desktop ≥1280px**   | Declarado 240px · **medido 260px em 25/25 telas**                   | Máx. 1200px centralizado; multi-coluna; tabelas completas                                  | Sidebar sempre visível; header com breadcrumbs + busca + notificações |
| **Tablet 768–1279px** | Rail icon-only — declarado 72px · **medido 56px em 9/9 telas iPad** | Largura total; cards no lugar de linhas de tabela; grids 2col → 1col; agenda mostra 3 dias | Barra de ações inferior; gestos de swipe                              |
| **Mobile <768px**     | Oculta; hambúrguer abre overlay full-screen                         | Coluna única; cards empilhados; tab bar inferior                                           | Tab bar: Dashboard, Agenda, Pacientes, Mais                           |

- **Tablet:** 12 telas a **1194×834** (iPad Pro 11" landscape). `ipad-preparar-sessao`, `ipad-modo-sessao` e `ipad-pos-sessao` **não têm rail** — modo sessão é full-screen.
- **Mobile:** a página `08 — MOBILE` está **vazia**. Não há nenhuma tela mobile desenhada; só existem as regras textuais acima. Ver DESIGN_DECISIONS #9.

---

## 11. Acessibilidade (`10 — DEV HANDOFF / Accessibility`)

Meta: **WCAG AA**.

- **Contraste:** 4.5:1 texto normal; 3:1 texto grande (≥18px ou ≥14px bold) e elementos não-textuais (ícones, bordas, focus rings).
- **Teclado:** tudo alcançável por Tab; ordem de foco = ordem visual; Esc fecha modais/popovers; Enter/Space ativa botões; setas navegam menus, calendários e tabs.
- **Foco:** anel visível `2px solid #3A4F43` com `2px` de offset. Nunca `outline: none` sem substituto. Focus trap em modais.
- **Leitores de tela:** alt em imagens; inputs ligados a labels via `htmlFor`/`id`; mudanças dinâmicas via `aria-live`; sidebar com `role="navigation"` + `aria-label`; modais com `role="dialog"` + `aria-modal="true"`.
- **Movimento:** respeitar `prefers-reduced-motion`; springs → transições instantâneas; sem parallax nem autoplay; transições funcionais simplificadas para fade.
- **Touch targets:** mínimo 44×44px em iPad; 32×32px em desktop; gap mínimo de 8px.
- **Clínico:** timer de sessão legível à distância de um braço; indicadores de confiança da IA perceptíveis **sem depender de cor** (ícone + texto); status de autosave anunciado para leitores de tela.

---

## 12. Google Calendar (`10 — DEV HANDOFF / Google Calendar Integration`)

- **OAuth:** Google OAuth2 via provider do Supabase Auth. Escopos `calendar.events`, `calendar.readonly`. Refresh token **criptografado** em `profiles.google_refresh_token`. Refresh via Edge Function middleware.
- **Sync:** bidirecional por webhook push (Google Calendar API push channel). Full sync inicial; incremental por `syncToken`. **Resolução de conflito: Serenità é a fonte de verdade para dados clínicos; Google Calendar é fonte de verdade para disponibilidade.**
- **Mapeamento de evento:** `summary` = **apenas iniciais do paciente (LGPD)**; `start`/`end`; `location` (endereço da clínica ou "Google Meet"); `conferenceData` (gera link Meet); `reminders` (email 24h, popup 30min). `extendedProperties` guarda `session_id` para lookup reverso.
- **Erros:** token expirado → auto-refresh; se falhar → banner de reconexão na Agenda. Quota excedida → enfileirar escritas, processar via cron. Falha de webhook → polling a cada 5 min. Offline → cache com timestamp de última sincronização.
- **Meet:** link auto-gerado quando o tipo da sessão é "Online"; guardado em `sessions.meet_link`; botão de entrar em Preparar Sessão e Modo Sessão; incluído no lembrete SMS/e-mail ao paciente.

---

## 13. Modelo de dados (`10 — DEV HANDOFF / Data Model`)

Esta é a especificação normativa adotada (ver DESIGN_DECISIONS #10). Multi-tenancy pela raiz `clinics`; **tudo escopado por `clinic_id` via RLS**.

| Tabela             | Papel                                                    | Colunas declaradas                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clinics`          | Raiz multi-tenant                                        | `id, name, slug, logo_url, settings (JSONB), subscription_plan, created_at`                                                                                                                       |
| `profiles`         | Perfis de usuário, ligados ao Supabase Auth              | `id (auth.uid), clinic_id, full_name, role (enum), avatar_url, specializations[], crp, phone, settings (JSONB)`                                                                                   |
| `patients`         | Pacientes. RLS: clínica + psicólogo designado            | `id, clinic_id, psychologist_id, full_name, cpf (encrypted), birth_date, phone, email, status (enum), emergency_contact, referral_source, notes, created_at`                                      |
| `sessions`         | Consultas/sessões, ligadas a eventos do Google Calendar  | `id, clinic_id, patient_id, psychologist_id, scheduled_at, duration_minutes, status (enum), type (enum), google_event_id, meet_link, notes_pre, notes_during, notes_post, ai_summary, created_at` |
| `clinical_records` | Registros clínicos HIPAA/LGPD, criptografados em repouso | `id, session_id, patient_id, psychologist_id, content (encrypted JSONB), record_type, tags[], signed_at, version`                                                                                 |
| `treatment_plans`  | Planos terapêuticos                                      | `id, patient_id, psychologist_id, title, objectives[], interventions[], status, review_date, created_at`                                                                                          |
| `invoices`         | Financeiro, auto-gerado de sessões concluídas            | `id, clinic_id, patient_id, session_id, amount, status (enum), payment_method, due_date, paid_at, receipt_url`                                                                                    |
| `documents`        | Documentos gerados                                       | `id, clinic_id, patient_id, template_id, content (JSONB), type, generated_by, file_url, created_at`                                                                                               |
| `consents`         | Consentimentos LGPD com assinatura digital               | `id, clinic_id, patient_id, consent_type, version, signed_at, signature_data, ip_address, revoked_at`                                                                                             |
| `tasks`            | Pendências                                               | `id, clinic_id, assigned_to, patient_id, title, description, priority (enum), due_date, completed_at, type`                                                                                       |
| `audit_log`        | Trilha imutável. **Insert-only, sem UPDATE/DELETE**      | `id, clinic_id, user_id, action, resource_type, resource_id, metadata (JSONB), ip_address, created_at`                                                                                            |

---

## 14. Stack (`10 — DEV HANDOFF / Tech Stack`)

| Camada     | Declarado no Figma                                                  | Adotado                                  | Nota                 |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------- | -------------------- |
| Frontend   | Next.js 14, React 18, TypeScript 5                                  | Next.js/React estáveis atuais, TS strict | DESIGN_DECISIONS #11 |
| Styling    | Tailwind CSS 3, CSS Modules para animações complexas                | Tailwind atual                           | DESIGN_DECISIONS #11 |
| State      | Zustand (global), TanStack Query (server state)                     | idem                                     | —                    |
| Backend    | Supabase (PostgreSQL, Auth, Storage, Realtime, RLS, Edge Functions) | idem                                     | —                    |
| Auth       | Supabase Auth (magic link + senha), Google OAuth para Calendar      | idem                                     | —                    |
| Calendar   | Google Calendar API (OAuth2, sync, webhook push)                    | idem                                     | —                    |
| Vídeo      | Google Meet (links auto-gerados via Calendar API)                   | idem                                     | —                    |
| SMS/Notif. | Twilio (SMS), Supabase Realtime (in-app)                            | idem                                     | —                    |
| IA         | OpenAI GPT-4                                                        | `AIProvider` + adapter OpenAI            | DESIGN_DECISIONS #11 |
| Hosting    | Vercel (frontend), Supabase Cloud (backend)                         | idem                                     | —                    |
| Monitoring | Sentry, Vercel Analytics, PostHog                                   | idem                                     | —                    |

### Design-to-code mapping declarado (`12:637`)

O Figma já fixa a API dos componentes React. **É contrato, e foi seguido:**

| Figma                       | React                                    | Classes                                                                                              |
| --------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Button (Primary/MD/Default) | `<Button variant="primary" size="md">`   | `bg-action-primary text-white rounded-md px-4 py-2 text-sm font-medium`                              |
| Button (Secondary/MD)       | `<Button variant="secondary" size="md">` | `bg-action-secondary text-text-primary rounded-md px-4 py-2 text-sm font-medium`                     |
| Button (Ghost/MD)           | `<Button variant="ghost" size="md">`     | `bg-transparent text-action-primary rounded-md px-4 py-2 text-sm font-medium hover:bg-surface-hover` |
| Button (Danger/MD)          | `<Button variant="danger" size="md">`    | `bg-action-danger text-white rounded-md px-4 py-2 text-sm font-medium`                               |
| Input (Default)             | `<Input label="…" placeholder="…">`      | `border border-border-default rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-action-primary` |
| Badge (Success)             | `<Badge variant="success">`              | `bg-status-successBg text-status-success rounded-full px-2.5 py-0.5 text-xs font-medium`             |
| Card (Outlined)             | `<Card variant="outlined">`              | `bg-white border border-border-default rounded-xl p-5`                                               |
| Toast (Error)               | `<Toast variant="error" title="…">`      | `bg-white rounded-lg shadow-lg border border-border-default p-3.5`                                   |
| Avatar (MD)                 | `<Avatar size="md" initials="AB">`       | `w-10 h-10 rounded-full bg-surface-hover …`                                                          |
| SidebarNavItem (Active)     | `<NavItem active icon={…}>`              | `flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/15 text-white font-semibold text-sm`      |
| Modal                       | `<Modal title="…" onClose={…}>`          | `bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full`                                                |
| Tag (Clinical)              | `<Tag variant="clinical">`               | `bg-surface-hover text-action-primary rounded-md px-2 py-0.5 text-xs font-medium`                    |

> As classes do mapping são aproximações do autor do Figma e divergem em alguns valores das specs medidas nos component sets (§3). **Os valores medidos prevalecem**; a API de props do mapping é seguida integralmente.

---

## 15. Acceptance criteria (`10 — DEV HANDOFF / Acceptance Criteria`)

Transcritos integralmente para `IMPLEMENTATION_PLAN.md`, onde viram checklist por fase. Requisitos globais, válidos para **toda** tela:

- Contraste WCAG AA (4.5:1 texto, 3:1 UI)
- Navegável por teclado — todo interativo alcançável via Tab
- Responsivo em Desktop (≥1280px) e Tablet (768–1279px)
- Todas as cores por token semântico — **nenhum hex hardcoded**
- Skeleton de loading no fetch inicial
- Error boundary com retry para falhas de API
- **RLS do Supabase aplicada — nenhum controle de acesso apenas client-side**
- `prefers-reduced-motion` respeitado
- TTI máximo de 3s em 4G
- Entrada de audit log para todo create/update/delete em dado sensível

---

## 16. Lacunas do Figma

Itens exigidos pelo prompt-mestre sem contrapartida no arquivo. Todos tratados em `DESIGN_DECISIONS.md`:

1. Página `08 — MOBILE` vazia — sem telas mobile.
2. Páginas `09 — INTERACTIVE PROTOTYPE` e `99 — ARCHIVE` não localizáveis por node ID.
3. Sem component set para ~19 primitivos (Textarea, Select, Checkbox, Radio, Switch, Tabs, Tooltip, Popover, Dropdown, Sheet, Drawer, Skeleton, EmptyState, ErrorState, Pagination, Command Palette, IconButton…).
4. Sem estado `focus-visible` nem `loading` desenhado no Button.
5. Sem tela de "permission denied".
6. Sem máquina de estados de transcrição desenhada.
7. Sem quadro de radius/shadow em Foundations (derivados dos componentes).
8. Sem Figma Variables publicadas — `get_variable_defs` e `search_design_system` retornam vazio; os tokens existem apenas como texto nos quadros de Foundations.
9. Módulo **Conhecimento** sem spec de ingestão/RAG (só a tela).
10. Identificador de paciente `PAC-###` aparece nas telas (ex. "Lucas Mendes • PAC-018") mas **não existe coluna correspondente** no Data Model do Dev Handoff.
