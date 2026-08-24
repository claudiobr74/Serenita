# DESIGN_DECISIONS.md — Serenità

Registro de ambiguidades, contradições e lacunas encontradas no Figma, e como foram resolvidas.

Regra que governa este documento (prompt-mestre §2 e §81):

- **Figma vence para UI/UX.**
- **Segurança e integridade de dados vencem sobre o Figma**, com a divergência documentada aqui.
- Onde o Figma é ambíguo: escolher a solução mais consistente com o resto do Serenità, mais simples, tecnicamente robusta e reversível.

Status possíveis: `DECIDIDO` · `DECIDIDO (usuário)` · `PENDENTE` · `ADIADO PARA FASE N`

---

## #1 — Sidebar clara vs. escura, e famílias tipográficas

**Status:** `DECIDIDO (usuário)` — 2026-08-24

**A contradição.** O arquivo se contradiz em dois pontos ligados:

| Fonte                                | Sidebar                                                                                                                | Tipografia                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `00 — README` (Product Rules)        | "Persistent left sidebar (240px desktop…). Dark (`#1F2421`) background."                                               | "Font: Inter (all weights). **No other typefaces.**"                               |
| `01 — FOUNDATIONS`                   | token `color/surface/sidebar` = `#1F2421`                                                                              | "Font family: Inter."                                                              |
| `02 — COMPONENTS` → `SidebarNavItem` | desenhado para fundo escuro: label `#C0C4C0`, ativo `rgba(58,79,67,.15)` + texto branco, hover `rgba(255,255,255,.08)` | Inter                                                                              |
| `06 — DESKTOP` (**36 telas**)        | `bg #FFFFFF`, `border-r #EAE6DF`, ativo = pill `#EAEFEA` + borda `#EAE6DF` + texto `#3A4F43`                           | **Newsreader** (display) + **Instrument Sans** (UI) + **JetBrains Mono** (atalhos) |

**Decisão.** Seguir **as 36 telas de `06 — DESKTOP`**: sidebar clara e as três famílias tipográficas. As páginas `00`, `01` e `02` são tratadas como **desatualizadas** nestes dois pontos específicos (o restante delas — paleta, escala de espaçamento, specs de componentes — continua normativo e foi confirmado nas telas).

**Justificativa.** As telas são o produto desenhado, são 36 e são internamente consistentes (a sidebar mede 260px e é branca em 25/25 telas com shell). O `SidebarNavItem` de `02 — COMPONENTS` não é usado como instância em nenhuma tela — é um componente órfão de uma direção visual anterior.

**Consequência de segurança que altera o Figma.** Nas telas, os labels de nav **inativos** estão em `#FFFFFF` sobre fundo `#FFFFFF` — literalmente invisíveis (contraste 1:1). Isso é resíduo da direção escura anterior, não intenção de design. Implementar como está violaria a própria regra de produto do arquivo ("WCAG AA minimum, 4.5:1"). **Os labels inativos usam `color/text/secondary` (`#5D625E`)**, que dá 6.4:1 sobre `#FFFFFF` e é coerente com o tratamento de texto secundário em todo o resto do sistema.

**Token afetado.** `color/surface/sidebar` (`#1F2421`) fica **sem uso** na implementação. Não foi removido do token layer — permanece definido e documentado como não utilizado, para não quebrar rastreabilidade com o Figma.

---

## #2 — Largura da sidebar: 240 vs. 260 vs. 280

**Status:** `DECIDIDO`

Três valores conflitantes no arquivo:

| Fonte                                        | Valor                          |
| -------------------------------------------- | ------------------------------ |
| `00 — README`                                | 240px                          |
| `10 — DEV HANDOFF / Responsive Rules`        | 240px                          |
| `01 — FOUNDATIONS / sidebar-header-behavior` | 260px ("DESKTOP FULL (260px)") |
| `06 — DESKTOP` — **medido em 25/25 telas**   | **260px**                      |

**Decisão: 260px.** As telas reais e a spec de motion concordam; os dois textos de 240px são a minoria e não correspondem a nada desenhado. Área de conteúdo começa em `x = 260`.

**Idem para o rail de tablet:**

| Fonte                                            | Valor    |
| ------------------------------------------------ | -------- |
| `10 — DEV HANDOFF`                               | 72px     |
| `01 — FOUNDATIONS / sidebar-header-behavior`     | 80px     |
| `07 — TABLET` — **medido em 9/9 telas com rail** | **56px** |

**Decisão: 56px**, pelo mesmo critério. Note que 56px ainda comporta o alvo de toque de 44pt exigido para iPad.

---

## #3 — Item de navegação "Sessões" sem rota correspondente

**Status:** `DECIDIDO`

A sidebar tem 11 itens, entre eles **"Sessões"**. O Route Map (`04 — IA`) não tem nenhuma rota `/sessoes`: todas as rotas de sessão são `/sessao/preparar/[id]`, `/sessao/[id]`, `/sessao/[id]/pos`, `/sessao/[id]/registro` — todas exigem uma sessão concreta.

**Decisão.** Criar `/sessoes` como **índice de sessões da clínica** (lista/filtro de sessões do profissional, ponto de entrada para o fluxo clínico). É a leitura mais consistente: o item existe na navegação de todas as 25 telas com shell, e a alternativa (remover o item) alteraria a navegação desenhada, o que §2 proíbe.

`/sessoes` é adicionada ao mapa de rotas como **29ª rota**, marcada como derivada. Papéis: `Psychologist` (mesmo escopo das demais rotas de sessão).

**Reversível:** se o autor do design confirmar que "Sessões" deveria apontar para `/agenda`, é uma linha de mudança no `NAV_ITEMS`.

---

## #4 — Button sem estado `focus-visible` nem `loading`

**Status:** `DECIDIDO`

O component set `Button` tem 36 variants cobrindo `style × size × state`, mas `state` só tem Default | Hover | Disabled.

- **`focus-visible`:** ausente do component set, mas **especificado em texto** em `10 — DEV HANDOFF / Accessibility`: "anel de foco visível: `2px solid #3A4F43` com `2px` de offset". Aplicado a todos os interativos, não só Button.
- **`loading`:** ausente do component set, mas especificado em `01 — FOUNDATIONS / interaction-states`: estado "LOADING" com label "Aguarde…" e `infinite spin 1s`. Além disso, `03 — PATTERNS / Actions` exige "desabilitar o botão de submit enquanto o formulário está enviando".

**Decisão.** Ambos implementados a partir das specs textuais do próprio Figma. Não é invenção: são requisitos escritos no arquivo que apenas não foram desenhados como variant.

---

## #5 — Card: variants `Default` e `Outlined` são idênticos

**Status:** `DECIDIDO`

Os três variants de `Card` (`12:196`) renderizam:

- `Default` → `bg #FFF · border 1px #EAE6DF · radius 12 · p 20`
- `Elevated` → `bg #FFF · shadow 0 2px 6px rgba(0,0,0,.06) · radius 12 · p 20` (sem borda)
- `Outlined` → **exatamente igual a `Default`**

**Decisão.** Manter os três nomes na API (`variant="default" | "elevated" | "outlined"`) porque o design-to-code mapping do Figma referencia `<Card variant="outlined">` explicitamente. `default` e `outlined` produzem o mesmo resultado visual — comportamento fiel ao arquivo. Documentado para que a duplicação não seja "corrigida" por engano numa refatoração futura.

---

## #6 — ~19 primitivos exigidos sem component set no Figma

**Status:** `ADIADO PARA FASE 2`

O prompt-mestre §8 exige um conjunto de primitivos; `02 — COMPONENTS` só define 10 (Button, Input, Badge, Avatar, Card, SidebarNavItem, TableRow, Toast, Tag, Modal).

Sem component set: Textarea, Select, MultiSelect, Checkbox, Radio, Switch, Tabs, Tooltip, Popover, Dropdown, Sheet, Drawer, Skeleton, EmptyState, ErrorState, Pagination, Search, Command Palette, IconButton.

**Vários existem desenhados dentro de telas**, e é de lá que a spec sai — não de invenção:

| Primitivo                | Onde está desenhado                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Search / Command Palette | `command-palette-search` (`6:6231`), SearchField do TopBar (`6:103`)                    |
| Tabs                     | `perfil-paciente` (`6:783`)                                                             |
| Skeleton                 | `loading-sync-states` (`6:6071`)                                                        |
| EmptyState               | `empty-states` (`6:5957`) + `03 — PATTERNS / Empty States`                              |
| ErrorState               | `error-warning-states` (`6:6162`) + `03 — PATTERNS / Error Handling`                    |
| Checkbox / Switch        | `01 — FOUNDATIONS / interaction-states` (specs de motion)                               |
| Sheet / Drawer           | `01 — FOUNDATIONS / interaction-states` (translateY + backdrop blur 16px, 400ms spring) |
| IconButton               | NotificationButton do TopBar (`6:112`)                                                  |

**Decisão.** Na Fase 2, cada primitivo é derivado da instância desenhada correspondente (extraída por `get_design_context`), aplicando os tokens de Foundations. Nenhum primitivo é criado do nada. Os que não têm nenhuma instância desenhada (Select, MultiSelect, Radio, Tooltip, Popover, Dropdown, Pagination) são construídos por consistência com Input e Modal, e listados aqui novamente quando forem implementados.

---

## #7 — Estado "permission denied" não desenhado

**Status:** `DECIDIDO`

A matriz RBAC é explícita e restritiva (Admin **não** vê conteúdo clínico; Secretary não vê nada clínico), mas não há tela de acesso negado.

**Decisão.** Duas camadas, seguindo o princípio de exposição mínima para dado clínico (§76 do prompt-mestre):

1. **Navegação:** itens de sidebar e ações fora do escopo do papel **não são renderizados** — não aparecem desabilitados. Evita revelar a existência de recursos.
2. **Acesso direto por URL:** a rota devolve o estado de erro definido em `03 — PATTERNS / Error Handling` para erro de página inteira (título + descrição + ação), com cópia de "sem permissão", sem revelar se o recurso existe.

Em ambos os casos o bloqueio real é server-side + RLS; a UI nunca é o mecanismo de segurança.

---

## #8 — Máquina de estados da transcrição não desenhada

**Status:** `ADIADO PARA FASE 6`

O Figma mostra o **resultado** ("Analisando transcrição de áudio para extrair temas recorrentes e deveres de casa…" em `loading-sync-states`) e exige consentimento prévio (diálogo em `dialogs-confirmations`), mas não desenha os estados intermediários.

**Decisão.** Adotar a máquina de estados do prompt-mestre §23 (`idle → connecting → recording → transcribing → paused → reconnecting → processing → completed → error`), renderizada com os componentes de loading/erro já definidos em `03 — PATTERNS`. Revisitar quando/se o Figma ganhar as telas.

---

## #9 — Página `08 — MOBILE` vazia

**Status:** `ADIADO PARA FASE 11`

A página existe e está **vazia** — nenhuma tela mobile desenhada. Só existem as regras textuais de `10 — DEV HANDOFF / Responsive Rules`: sidebar oculta atrás de hambúrguer com overlay full-screen; coluna única; cards empilhados; tab bar inferior com Dashboard, Agenda, Pacientes, Mais.

**Decisão.** Desktop e Tablet são implementados com fidelidade a frames reais. Mobile é implementado **apenas conforme as regras textuais**, e marcado como não verificável contra o Figma até que as telas existam. Os acceptance criteria globais do próprio Figma pedem responsividade apenas em "Desktop (≥1280px) e Tablet (768–1279px)" — mobile não está no Definition of Done do arquivo.

---

## #10 — Modelo de dados: `clinics`/`profiles` vs. `organizations`/`memberships`

**Status:** `DECIDIDO (usuário)` — 2026-08-24

O prompt-mestre §12 propõe `organization → memberships → users`. O `10 — DEV HANDOFF / Data Model` especifica `clinics → profiles` com `role` diretamente em `profiles`, e 9 outras tabelas com colunas nomeadas.

**Decisão.** Seguir o Data Model do Dev Handoff. É a especificação concreta, nomeia colunas, e o resto do arquivo (RBAC, GCal, audit) é escrito em cima dela.

**Consequência aceita:** `profiles.clinic_id` + `profiles.role` significam **um usuário pertence a exatamente uma clínica com exatamente um papel**. Não há multi-membership. Isso é mais simples e adequado ao domínio (um psicólogo de uma clínica), e é reversível: introduzir uma tabela `memberships` depois não exige reescrever as políticas de RLS, que se apoiam em funções auxiliares (`current_clinic_id()`, `current_role()`) e não em joins diretos.

---

## #11 — Versões de stack e acoplamento a fornecedor de IA

**Status:** `DECIDIDO (usuário)` — 2026-08-24

O `10 — DEV HANDOFF / Tech Stack` fixa "Next.js 14 (App Router), React 18, TypeScript 5", "Tailwind CSS 3" e "OpenAI GPT-4".

**Decisão.**

- **Versões:** usar as versões estáveis atuais (Next.js 16, React 19, Tailwind 4). Next.js 14 e React 18 já não recebem suporte pleno; fixá-los criaria dívida de segurança desde o dia zero. Isto **não é decisão de UI/UX**, então a cláusula "Figma vence para UI/UX" não se aplica — aplica-se a exceção de segurança/manutenção de §2.
  - Impacto prático: Tailwind 4 usa configuração CSS-first (`@theme` em `globals.css`) em vez de `tailwind.config.js`. Isso **favorece** o requisito §7 de camada centralizada de tokens.
- **IA:** implementar a interface `AIProvider` (§25 do prompt-mestre) com um adapter OpenAI como primeiro e único provedor. Nenhum serviço de domínio importa o SDK da OpenAI diretamente. O Figma especifica o _fornecedor_, não a _arquitetura de acoplamento_; a abstração satisfaz o Figma e o prompt-mestre ao mesmo tempo.

---

## #12 — Identificador `PAC-###` sem coluna no modelo de dados

**Status:** `ADIADO PARA FASE 4`

As telas mostram pacientes como `Lucas Mendes • PAC-018` (visto em `01 — FOUNDATIONS / key-transitions` e nas telas de paciente), e o prompt-mestre §16 exige esse formato e um identificador interno estável. Mas a tabela `patients` do Dev Handoff não tem coluna para ele.

**Decisão.** Adicionar `patients.display_code` (ex.: `PAC-018`), gerado por sequência **por clínica**, imutável, `UNIQUE (clinic_id, display_code)`. É adição ao modelo do Figma, não alteração: nenhuma coluna declarada foi removida ou renomeada. Justificativa dupla — a UI desenhada exige o código, e §16 proíbe usar o nome como identificador técnico.

---

## #13 — Tokens não existem como Figma Variables

**Status:** `DECIDIDO`

`get_variable_defs` e `search_design_system` retornam vazio para este arquivo. Os tokens existem apenas como **texto nos quadros de Foundations** (ex.: um label "color/background/primary" ao lado de um swatch com a legenda "#FFFFFF · Cards, surfaces"). O Dev Handoff afirma que "todas as durações são armazenadas como Figma Variables na coleção Motion" — não são.

**Decisão.** Os tokens foram transcritos manualmente dos quadros de Foundations para `src/styles/tokens.css`, preservando **exatamente** a nomenclatura do Figma (`color/background/primary` → `--color-background-primary`), de modo que a correspondência Figma ↔ código continue verificável linha a linha. Se as Variables forem publicadas depois, a extração automática deve produzir os mesmos nomes.

Tokens **derivados** (não presentes nos quadros de Foundations, mas usados de forma consistente nos component sets — `color/border/default`, `color/surface/muted`, os `*Bg` de status, radius e shadow) estão marcados como derivados em `tokens.css` e listados na §2.1/§2.4/§2.5 do `FIGMA_AUDIT.md`, com a origem de cada um.

---

## #14 — Páginas `09 — INTERACTIVE PROTOTYPE` e `99 — ARCHIVE` não localizadas

**Status:** `PENDENTE` (sem impacto)

O README declara as duas páginas. `get_metadata` sem `nodeId` lista apenas `00`; as demais foram alcançadas por IDs sequenciais a partir de `6:8434`. As páginas `09` e `99` não responderam nessa sequência.

**Impacto:** nenhum. O README classifica `09` como "future" e `99` como "deprecated or superseded designs" — nenhuma das duas é normativa. Registrado apenas para que a auditoria seja honesta sobre o que **não** foi lido.

---

## #15 — Dois designs de Toast conflitantes

**Status:** `DECIDIDO`

O arquivo tem dois toasts que não se parecem:

| Fonte                                          | Design                                                                                                                                                                                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `02 — COMPONENTS / Toast` (12:240)             | Card branco, `w 360`, `radius 10`, borda, **barra de acento 4×24** colorida à esquerda, shadow-md. Título 14 SemiBold, mensagem 13.                                                                                                                 |
| `06 — DESKTOP / error-warning-states` (6:6212) | **Preenchido**: sucesso `bg action-primary` com texto branco, erro `bg action-danger` com texto branco, info branco com borda. `radius 12`, `p 16`, ícone 18 + fechar 14, shadow `0 16px 24px rgba(31,36,33,.04)`. Título 13 SemiBold, mensagem 12. |

**Decisão.** Seguir o das telas, pelo mesmo precedente de #1: quando o component set diverge de `06 — DESKTOP`, as telas prevalecem. O toast preenchido também comunica severidade com mais força, o que importa num produto clínico onde uma falha de gravação não pode passar despercebida.

O `warning` não existe em nenhuma das duas fontes — foi derivado por consistência, usando o par `status-warning-bg` / `status-warning` que o Figma já define.

---

## #16 — Tamanho e variante de botão que só existem nas telas

**Status:** `DECIDIDO`

O component set `Button` (12:147) define `SM`/`MD`/`LG` e as variantes Primary/Secondary/Ghost/Danger. O design-to-code mapping (12:637) confirma `MD` = `px-4 py-2 text-sm font-medium`.

Só que os botões de ação desenhados nas telas de `06 — DESKTOP` não são nenhum desses:

| Onde                                    | Spec medida                                    |
| --------------------------------------- | ---------------------------------------------- |
| EmptyState CTA (6:5973)                 | `px 20 · py 12 · radius 8 · 14px **SemiBold**` |
| ErrorState "Tentar Novamente" (6:6180)  | idem                                           |
| Banner de consentimento (6:6201)        | idem                                           |
| EmptyState secundário (6:5982)          | idem, mas `bg branco + border`                 |
| ErrorState "Trabalhar Offline" (6:6183) | idem                                           |

Isso fica entre `MD` (px 16, py 8) e `LG` (px 24, py 12), com peso SemiBold em vez de Medium. E o secundário das telas é **outline** (branco com borda), não o `Secondary` bege do component set.

**Decisão.** Preservar as duas verdades em vez de escolher:

- `size="cta"` — o botão de ação das telas.
- `variant="outline"` — a ação secundária das telas.

`sm`/`md`/`lg` e `secondary` seguem exatamente o component set, que é confirmado pelo handoff. Nada foi sobrescrito; o vocabulário apenas cresceu para cobrir o que as telas realmente desenham.

---

## #17 — Contraste: a paleta do Figma falha na regra de acessibilidade do próprio Figma

**Status:** `DECIDIDO` — correção mínima aplicada

Auditoria automatizada de contraste sobre o design system renderizado (todos os nós de texto, comparados com o fundo real computado) encontrou combinações abaixo do mínimo AA de 4.5:1 que `10 — DEV HANDOFF / Accessibility` exige explicitamente.

**Falhas na paleta do Figma:**

| Combinação                                                  | Figma                 | Ratio | Mínimo |
| ----------------------------------------------------------- | --------------------- | ----: | -----: |
| `status-error` como texto sobre `status-error-bg`           | `#C2735A` / `#F9ECE8` |  3.09 |    4.5 |
| `status-info` como texto sobre `status-info-bg`             | `#5B7FA6` / `#EBF1F7` |  3.67 |    4.5 |
| `status-success` como texto sobre `status-success-bg`       | `#3A7D5C` / `#E8F5EE` |  4.39 |    4.5 |
| `status-error` como texto sobre branco                      | `#C2735A` / `#FFFFFF` |  3.56 |    4.5 |
| Branco sobre `action-danger` (Button Danger, Toast de erro) | `#FFFFFF` / `#C2735A` |  3.56 |    4.5 |
| `text-muted` como texto de conteúdo                         | `#8A8F8A` / `#FFFFFF` |  3.29 |    4.5 |

**O próprio Figma já resolveu esse problema uma vez.** Em `warning`, o tom de preenchimento (`#D6A374`) é claro demais para texto, então o arquivo usa um tom de texto separado e mais escuro (`#846447` = 4.81:1). O mesmo cuidado simplesmente não foi estendido aos outros status.

**Correções aplicadas** — todas seguindo o padrão que o arquivo já estabeleceu, sem inventar cor nova:

1. **Tokens `*-text` por status.** `status-success-text` `#397B5B`, `status-error-text` `#9B5C48`, `status-info-text` `#506F92` — mesmo matiz, escurecidos até 4.5:1. Usados **apenas em texto**. Os tons originais seguem intactos para preenchimento, ícone, borda e barra de acento, onde o mínimo é 3:1 e todos passam.

2. **`action-danger` `#C2735A` → `#A8644E`.** `#A8644E` não é cor nova: é o `Button Danger Hover` do próprio component set, e dá 4.57:1 com branco. O hover desce um passo, para `#905643`. Reversível em duas linhas de `tokens.css`.

3. **`text-muted` intocado.** Continua exatamente como o Figma define, para placeholder, ícone e texto decorativo — onde os 3:1 se aplicam ou há isenção. Texto de conteúdo (hints, mensagens de apoio, legendas) passou a usar `text-secondary` `#5D625E` (6.22:1), que já existia na paleta. Nenhuma mudança de token.

4. **Mensagem do toast de erro.** O Figma usa `status-error-bg` (`#F9ECE8`); sobre o `action-danger` corrigido isso dá 3.96:1. Como o fundo é escuro, branco (4.57:1) é o único tom que atinge AA. A hierarquia entre título e mensagem passa a vir de peso e tamanho, como já acontece no toast de sucesso.

**Resultado:** de 93 falhas AA para **zero**, verificado no browser.

Esta é a aplicação literal da regra §2 do prompt-mestre — "se houver conflito entre Figma e segurança/integridade, segurança vence, documentando a divergência" — com a agravante de que aqui o Figma conflita com uma regra do próprio Figma.

**Recomendação ao design:** revisar `#C2735A` e `#8A8F8A` na fonte. Como estão, ambos são inutilizáveis para texto pequeno sob a meta declarada de WCAG AA.

---

## #18 — `tailwind-merge` descartava classes de cor silenciosamente

**Status:** `DECIDIDO`

Não é uma decisão de design, mas o defeito nasceu da nomenclatura de tokens e vale registrar.

A escala tipográfica do Serenità gera utilitários como `text-body` e `text-h2`. O `tailwind-merge` não conhece essa escala e classifica todo `text-*` como cor. Ao receber `text-text-inverse` e `text-body` na mesma chamada de `cn()`, ele descartava a cor.

O efeito: **todo botão primário e de perigo ficou com texto `#1F2421` sobre fundo verde escuro — 1.79:1.** Lint, typecheck e build passaram; só a auditoria de contraste no browser encontrou.

Corrigido com `extendTailwindMerge` em `src/lib/cn.ts`, declarando a escala como grupo `font-size`. A lista precisa acompanhar os tokens `--text-*` de `tokens.css`.

---

## #19 — Magic link exigido pelo plano, ausente do frame de login

`IMPLEMENTATION_PLAN.md` Fase 3 pede "magic link + senha", e o Route Map do
Figma registra `/login` como "Supabase Auth, magic link + senha". Mas o frame
`login` (6:9) desenha **apenas** senha e Google — não há botão de magic link.

**Decisão:** implementar o magic link como ação secundária, no bloco de ações
onde o frame coloca o botão do Google. A hierarquia visual do frame é
preservada: uma ação primária cheia, as demais em `outline`.

## #20 — Google OAuth desenhado na Fase 3, credencial só na Fase 5

O frame 6:9 traz "Continuar com Google", mas a integração com Google depende de
client OAuth que o plano só prevê na Fase 5, e que ainda não existe.

**Decisão:** renderizar o botão **desabilitado**, com `title` explicando
quando ficará disponível, em vez de omitir. Omitir faria a tela divergir do
Figma e esconderia da equipe que a funcionalidade está prevista; um botão que
falha ao ser clicado seria pior. Vira ativo na Fase 5 sem mudança de layout.

## #21 — Assets do login não puderam ser baixados

`LogoMark` (6:13) é um PNG e `BackgroundGlow` (6:10) é um SVG, ambos exportados
pelo Figma. O ambiente desta sessão bloqueia o CDN da Figma por política de
rede (403 no CONNECT para `www.figma.com`), e o README do proxy é explícito em
não insistir em negação de política.

**Decisão:** reservar a geometria exata dos dois (120px para o logo, 600px
centrados e 50px acima do meio para o glow) e ocupar com o tratamento de marca
que a Sidebar já usa e com um brilho em token. A troca pelos arquivos reais é
de uma linha em cada ponto.

**Resolvido.** O usuário forneceu os dois arquivos diretamente:
`public/brand/logomark.png` (o lockup completo, marca + wordmark) e
`public/brand/login-glow.png` — este último com exatamente 600×600, batendo com
a spec do frame. Ambos entram por `next/image`, que redimensiona e serve
formato moderno; o logo tem 1254px de origem e nunca chega assim ao usuário.
Há teste e2e que confere `naturalWidth > 0`, ou seja, que o arquivo carregou de
fato — e não apenas que o `<img>` existe.

O wordmark do arquivo lê **Serenit_à_** (acento grave), o que resolve a
ambiguidade do achado 15 da revisão: a marca é "Serenità". A cópia das telas
segue como está no Figma, inclusive "Entrar no Serenit_á_" (6:33), porque mudar
texto de interface é decisão de produto, não de implementação.

## #22 — `/recuperar` sem frame desenhado

O link "Esqueci minha senha" (6:26) aponta para `/recuperar`, mas a página não
existe em `06 — DESKTOP`, e a Fase 3 exige recuperação de senha com e-mail em
até 30s.

**Decisão:** reusar a moldura do card de login — mesmo container, mesmo
espaçamento, mesmos primitivos — com cabeçalho e um único campo. Nada de
invenção visual: é a tela de login com o miolo trocado.

---

## #23 — O card RBAC do frame contradiz a RBAC Matrix

O card "Níveis de Acesso" de `usuarios-permissoes` descreve o Administrador
como tendo "acesso irrestrito a configurações de clínica, **prontuários de
todos os membros**, faturamento global e logs" (6:5148).

A RBAC Matrix de `04 — INFORMATION ARCHITECTURE` diz o oposto, em negrito:
"**Não acessa registros clínicos** (compliance HIPAA/LGPD)". É a mesma regra que
`FIGMA_AUDIT.md` §7 marca como "ponto crítico de segurança", que
`is_clinical_role()` aplica no banco, e que tem cenário dedicado na suíte de RLS.

**Decisão:** seguir a RBAC Matrix e reescrever a cópia do card. Exibir o texto
do frame afirmaria ao usuário uma propriedade de conformidade que é falsa no
sistema — e num produto clínico isso é pior do que divergir do desenho. Há teste
que falha se alguém transcrever a cópia original.

## #24 — Papel composto no frame, papel único no modelo

A primeira linha da tabela de membros mostra "Admin, Psicóloga" (6:5114), ou
seja, dois papéis para a mesma pessoa. `profiles.role` é um enum **único**,
decidido em #10 a partir do data model do Dev Handoff.

**Decisão:** manter papel único. Multi-papel mudaria o modelo de tenancy, as
três funções de autorização e toda policy de RLS — e a RBAC Matrix, que é a
fonte normativa dos papéis, descreve os três como mutuamente exclusivos.

**Caminho de reversão**, se o produto exigir: tabela `profile_roles` (perfil ×
papel) e `current_profile_role()` virando `current_profile_roles()`, com as
policies passando a usar `has_role(...)`. As policies mudam, o resto não.

## #25 — Onboarding anuncia 9 passos, só 1 desenhado

O StepCounter diz "PASSO 1 DE 9" (6:5225) e a ProgressBar mostra 53 de 480px,
≈11%, coerente com 1/9. Mas `06 — DESKTOP` só traz o passo 1.

**Decisão:** implementar o passo 1 com fidelidade, e manter o contador e a barra
com o total de 9 vindo de `TOTAL_DE_PASSOS`. O "Pular por enquanto" (6:5258) é
saída válida do wizard, então a aplicação é utilizável com um passo só. Os
outros 8 entram quando forem desenhados.

## #26 — O onboarding não cria a clínica

`/onboarding` é **Auth + Admin** no Route Map. Um wizard que criasse a clínica
precisaria rodar sem perfil — não há como ser admin de uma clínica que ainda não
existe.

**Decisão:** o wizard **completa** uma clínica já provisionada, o que o conteúdo
do passo 1 confirma (CNPJ, endereço, telefone, tipo — dados de complemento, não
de criação). A criação de clínica e do primeiro admin é caminho privilegiado,
por `service_role`, fora do alcance da aplicação. É também o que permite às
policies não terem `INSERT` em `clinics`.

**Consequência:** falta um script de provisionamento. Sem ele não há como criar
a primeira clínica, nem semear o usuário que os testes e2e de shell exigem.

## #27 — Convite criado, e-mail ainda não enviado

O convite é gravado em `invitations` com token de 32 bytes, do qual o banco
guarda só o SHA-256, e aparece na tabela como "Convite Pendente". Mas **o e-mail
não é enviado**: não há provedor transacional configurado.

**Decisão:** entregar o convite persistido e visível, com a interface dizendo
explicitamente que o envio depende do provedor. Melhor do que um botão que
aparenta enviar e não envia.

## #28 — Sub-navegação de Configurações com 8 seções, 1 implementada

O frame 6:5078 traz oito seções. Nesta fase só "Usuários e Acessos" existe, e
"Dados da Clínica" aponta para o wizard.

**Decisão:** renderizar as oito, com as não implementadas desabilitadas e o
`title` dizendo em que fase chegam — em vez de omitir ou de criar links
quebrados. Mesma escolha do botão do Google (#20).

## #29 — Coluna Email vazia para membros ativos

A tabela do frame tem coluna Email (6:5107) preenchida para todos. Mas o e-mail
mora em `auth.users`, que **não é legível pelo cliente sob RLS**, e `profiles`
não o espelha.

**Decisão:** exibir o e-mail apenas para convites pendentes, onde ele vive em
`invitations`, e marcar "—" para membros ativos. As alternativas eram piores:
duplicar dado pessoal em duas tabelas, ou expor `auth.users`.

**Para resolver:** ou uma view `SECURITY DEFINER` que devolva só o e-mail dos
perfis da própria clínica, ou aceitar a duplicação com trigger de sincronia.
Decisão de modelo, não de tela — vale discutir antes da Fase 4.

## #30 — Consentimento de cookies sem opção de rejeitar

A LGPD exige consentimento para cookie não essencial. O Serenità hoje só usa
cookie de sessão do Supabase, que é estritamente necessário à execução do
contrato (art. 7º, V) e dispensa consentimento prévio.

**Decisão:** o banner **informa**, não pede permissão, e por isso não tem
"Rejeitar" — não há nada opcional a rejeitar, e um botão que não faz nada seria
teatro de conformidade. O reconhecimento fica em `localStorage`, não em cookie.

**Revisitar na Fase 12:** PostHog e Sentry são categoria opcional e vão exigir
escolha granular, com rejeição real e persistência da preferência.
