# TESTING.md — Serenità

Estratégia de testes em camadas.

---

## Camadas

| Camada      | Ferramenta               | Escopo                                                                |
| ----------- | ------------------------ | --------------------------------------------------------------------- |
| Unit        | Vitest                   | `src/domain/` — regras de negócio, validadores, policies, utilitários |
| Component   | Vitest + Testing Library | Primitivos do design system e componentes de domínio críticos         |
| Integration | Vitest                   | Supabase, auth, Google Calendar, IA, transcrição                      |
| **RLS**     | Vitest + Supabase        | Categoria própria — isolamento de tenant e acesso clínico             |
| E2E         | Playwright               | Fluxos completos, em desktop e tablet                                 |

```bash
npm run test        # unit + component + integration
npm run test:e2e    # Playwright
```

---

## Testes de RLS

`supabase/tests/rls.sql` é a suíte exigida pelo ADR 001. Roda inteira dentro de
uma transação e termina em `rollback`, então pode ser executada contra qualquer
ambiente sem deixar resíduo:

```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/rls.sql
```

São 65 cenários, um por linha da tabela de ameaças de `AUTHORIZATION.md`, sobre
duas clínicas com os três papéis. Cada um declara o esperado e o obtido; ao
final, qualquer divergência levanta exceção, o que aborta a transação e
sinaliza erro para quem chamou.

Os cenários de escalação e de forja de auditoria não são hipotéticos: foram
falhas **reais** neste banco, encontradas na revisão das Fases 0–2 e corrigidas
na migration `20260824180540`. Estão aqui para não voltarem.

Os cenários 49–62 cobrem o prontuário: autoria não forjável, histórico escrito
só por trigger, coalescência do autosave e — o mais sutil — a garantia de que a
versão final de um profissional sobrevive quando outro assume o paciente e
sobrescreve o texto. Esse último encontrou um erro real na coalescência antes
de ele existir em produção.

O cenário de perfil arquivado cobre uma consequência fácil de perder de vista:
`current_clinic_id()` filtra `archived_at is null`, então arquivar um perfil
revoga o acesso pelo banco, não só pela UI.

Categoria própria porque um `where` esquecido não é bug de UI — é vazamento de
prontuário.

Casos obrigatórios:

- clínica A tentando ler dados da clínica B — `select`, `update`, `delete`, e por ID conhecido
- `secretary` tentando acessar registro clínico
- **`admin` tentando acessar registro clínico** — deve falhar
- usuário sem perfil
- usuário arquivado
- `INSERT` tentando forjar `clinic_id` de outra clínica
- `UPDATE`/`DELETE` em `audit_log`
- auto-promoção de papel em `profiles`

Executados contra um banco real com migrations aplicadas, autenticando como cada
papel. Nunca com `service_role` — ela contorna exatamente o que está sob teste.

---

## E2E — fluxos obrigatórios

Conforme §46 do prompt-mestre e os User Flows do Figma.

**Autenticação** — login · logout · acesso não autorizado

**Paciente** — criar · visualizar · editar · arquivar

**Consulta** — criar · remarcar · cancelar · sync com Google Calendar

**Sessão clínica** — preparar · iniciar · estado de transcrição · encerrar ·
debrief · finalizar registro

**Permissão** — secretary não acessa conteúdo clínico

**Isolamento** — organização A não acessa organização B

### Viewports

Os dois breakpoints que o Figma exige no Definition of Done:

| Projeto   | Viewport  | Corresponde a                                    |
| --------- | --------- | ------------------------------------------------ |
| `desktop` | 1440×1024 | Frames de `06 — DESKTOP`                         |
| `tablet`  | 1194×834  | Frames de `07 — TABLET` (iPad Pro 11" landscape) |

---

## QA visual

Após implementar cada tela (§47–48):

1. Rodar a aplicação local
2. Abrir a rota
3. Capturar screenshot no viewport correspondente
4. Comparar com o frame do Figma
5. Ajustar as diferenças
6. Repetir

Verificar: dimensões · espaçamento · alinhamento · tipografia · cores · radius ·
sombras · ícones · responsivo · estados · animações.

**Uma tela não é concluída por "parecer semelhante".**

Prioridade: Dashboard · Agenda · Perfil Paciente · Preparar Sessão · Modo Sessão ·
Debrief · Supervisor IA.

---

## Testes que protegem regras invioláveis

Certas regras são fáceis de quebrar por engano numa refatoração. Cada uma tem um
teste cuja falha é o alarme:

| Regra                                                                    | Teste                                    |
| ------------------------------------------------------------------------ | ---------------------------------------- |
| `admin` não acessa conteúdo clínico                                      | `src/domain/auth/policy.test.ts`         |
| Sidebar não expõe destinos clínicos por papel                            | `src/components/shell/nav-items.test.ts` |
| Nenhum campo clínico vai para o Google Calendar                          | Fase 5 — serializador de evento          |
| Sync de calendário é idempotente                                         | Fase 5                                   |
| Áudio não trafega por route handler                                      | Fase 6                                   |
| Transcrição não vira registro clínico sem revisão                        | Fase 6                                   |
| Artefato de IA não revisado não é registro finalizado                    | Fase 7                                   |
| Serviço de IA recusa sem consentimento, com a UI contornada              | Fase 7                                   |
| Nenhum módulo fora de `server/providers/ai/` importa o SDK do fornecedor | Fase 7                                   |

---

## O que não fazer

- Não testar contra dados clínicos reais. Seed é sempre fictício.
- Não usar `service_role` em teste de RLS.
- Não marcar uma feature como pronta com teste crítico falhando.
- Não desabilitar ou pular um teste para obter build verde.

---

## Quality gates

Antes de cada milestone:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Nenhum milestone é considerado pronto com erro de TypeScript, erro relevante de
lint, build quebrado ou teste crítico falhando.

### Na integração contínua

`.github/workflows/ci.yml` roda o gate a cada push e a cada pull request, em
dois jobs paralelos:

| Job         | Conteúdo                                                 |
| ----------- | -------------------------------------------------------- |
| `qualidade` | `lint` · `typecheck` · `format:check` · `test` · `build` |
| `e2e`       | Playwright em Desktop (1440×1024) e Tablet (1194×834)    |

Os passos de `qualidade` usam `if: !cancelled()`, então rodam mesmo depois de
um passo vermelho: um push com três problemas revela os três de uma vez, em vez
de exigir três rodadas.

O job `e2e` instala o próprio Chromium (`playwright install --with-deps`), casado
com a versão de `@playwright/test` do `package-lock.json`. Em ambiente com
Chromium pré-instalado numa revisão diferente, apontar `PLAYWRIGHT_CHROMIUM_PATH`
para o binário disponível — `playwright.config.ts` já lê essa variável.

O build recebe `NEXT_PUBLIC_SUPABASE_*` de fachada. Nenhum job fala com o
Supabase: são apenas o suficiente para a validação de `src/lib/env.ts` passar
quando as telas de auth da Fase 3 começarem a importar o cliente. Se os secrets
homônimos forem cadastrados no repositório, têm precedência.

A versão do Node vem de `.nvmrc`, para que CI e máquina local não divirjam.

### Um login para a suíte inteira

`e2e/auth.setup.ts` autentica uma vez e grava o estado; os specs que precisam
de sessão o reusam com `test.use({ storageState })`.

Não é só velocidade. Antes, cada teste fazia o próprio `signInWithPassword`, e
o **Supabase Auth limita a taxa de login**: execuções seguidas da suíte
falhavam por cota estourada — um modo de falha que não é defeito do produto e
que custa caro porque parece um. A suíte passou de ~4,8min com falhas
intermitentes para ~50s estável.

Duas armadilhas que isso cria, ambas cobertas por comentário no código:

- `auth.spec.ts` **não** usa o estado: ele testa o comportamento sem sessão.
- `browser.newContext()` dentro de um arquivo com `test.use({ storageState })`
  **herda** a sessão. Onde um contexto realmente limpo é necessário — abrir um
  convite como visitante — é preciso `newContext({ storageState: undefined })`.

### Testes que exigem sessão

`e2e/shell.spec.ts` precisa de um usuário real com perfil ativo, e por isso é
pulado quando `E2E_EMAIL` e `E2E_SENHA` não estão definidos — com o motivo
declarado no relatório, não em silêncio.

Para habilitá-los, semeie o usuário com o script de provisionamento; o passo a
passo está em `supabase/seed/README.md`.

`e2e/pacientes.spec.ts` também cria dado real, mas com uma diferença que
importa: `patients` **não tem policy de DELETE**, por design — a Fase 4 prevê
exclusão com confirmação e aprovação de admin, que é fluxo próprio. O teste
arquiva o paciente ao final, e arquivar não apaga.

Consequência prática: o paciente permanece, e o índice `patients_cpf_unico`
recusa a recriação. O teste então **se pula**, com a mensagem dizendo o que
fazer, em vez de falhar por um motivo que não é defeito do produto. Para rodar
de novo, remova o resíduo no banco:

```sql
delete from public.patients where full_name like 'Paciente E2E %';
```

`e2e/convite.spec.ts` está no mesmo regime e vai além: ele **cria dado real** no
banco. Por isso se limpa — revoga o convite ao final e revoga resíduo no início,
para ser idempotente mesmo depois de uma execução interrompida. O e-mail do
convidado leva o nome do projeto como sufixo, porque desktop e tablet rodam em
paralelo e o índice `invitations_pendente_unico` permite um convite pendente por
e-mail e clínica — com endereço fixo, um projeto derrubaria o outro.
