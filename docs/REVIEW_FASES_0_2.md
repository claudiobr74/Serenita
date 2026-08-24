# Revisão das Fases 0–2 — Serenità

Auditoria independente do estado do repositório no commit `8f5e52e` (`Fase 2 —
Design System`), feita antes de iniciar a Fase 3.

**Método:** execução real do quality gate, inspeção do código, e verificação do
estado ao vivo do projeto Supabase `bsaoujbfanluzggjvhfa` via MCP — comparando
o que o `IMPLEMENTATION_PLAN.md` declara concluído com o que de fato existe.

---

## Veredito

As Fases 0–2 estão substancialmente entregues e a qualidade do que existe é
alta. As reivindicações do plano se sustentam quase todas sob verificação.

Restam **duas falhas de autorização no banco** que valem correção antes da
Fase 4 (quando tabelas clínicas passam a existir e elas deixam de ser
latentes), e **quatro lacunas de processo** que fazem o quality gate declarado
depender de execução manual.

---

## Verificado e confirmado

| Reivindicação do plano                         | Resultado                                                       |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `lint` · `typecheck` · `test` · `build` verdes | ✅ os quatro passam                                             |
| 34 testes unitários e de componente            | ✅ 34 testes, 4 arquivos, 2,16s                                 |
| Migrations aplicadas no Supabase               | ✅ ambas presentes no projeto remoto                            |
| RLS ativa nas 3 tabelas                        | ✅ `enable` **e** `force` em `clinics`, `profiles`, `audit_log` |
| Policies conforme as migrations                | ✅ 2 / 4 / 2, expressões idênticas às dos arquivos              |
| `/dev/components` ausente em produção          | ✅ dois guards independentes verificados                        |
| 18 divergências registradas · 4 ADRs           | ✅ conferem                                                     |
| Correção do `tailwind-merge` (#18)             | ✅ presente, com teste de regressão                             |
| Correções de contraste (#17)                   | ✅ nos tokens, com justificativa e caminho de reversão          |

Sobre `/dev/components`: o guard foi verificado no artefato de build, não só no
código. `.next/server/app/dev/components.meta` traz `"status": 404` — a página
é pré-renderizada como _not found_. O redirect de `next.config.ts` é a segunda
barreira, como documentado.

---

## Achados

### 1 — Admin pode se auto-promover e alcançar prontuário · **alta**

`profiles_update_admin` tem `WITH CHECK` apenas sobre `clinic_id`:

```sql
using       ((clinic_id = current_clinic_id()) AND (current_profile_role() = 'admin'))
with check  (clinic_id = current_clinic_id())
```

Policies permissivas do Postgres são combinadas por **OR**. O `WITH CHECK` mais
estrito de `profiles_update_self` — que exige `role = current_profile_role()` e
que `AUTHORIZATION.md` cita como a defesa contra escalação — não restringe quem
já passa por `profiles_update_admin`.

Consequência: um admin autenticado executa

```sql
update profiles set role = 'psychologist' where id = auth.uid();
```

`is_clinical_role()` passa a devolver `true` e o acesso clínico se abre. Isso
derruba a linha "Admin lendo prontuário" da tabela de ameaças e a restrição que
a própria migration marca em caixa alta ("`admin` NÃO tem acesso clínico —
HIPAA/LGPD compliance").

**Hoje é latente**: não há tabela clínica. Passa a ser explorável na Fase 4.

Correção sugerida, em uma linha de `WITH CHECK`:

```sql
with check (
  clinic_id = current_clinic_id()
  and (id <> auth.uid() or role = public.current_profile_role())
)
```

Admin continua gerindo o papel dos colegas; deixa de mexer no próprio.

### 2 — `audit_log` aceita registro forjado por qualquer membro · **média**

```sql
with check (clinic_id = current_clinic_id())
```

`user_id`, `action`, `resource_type`, `resource_id`, `metadata` e `created_at`
ficam livres. Qualquer perfil autenticado — inclusive `secretary` — pode
inserir uma entrada atribuída a outro usuário, ou com `created_at` retroativo.

`AUTHORIZATION.md` cobre adulteração de linha existente (sem policy de
`UPDATE`/`DELETE`, mais `force row level security`), o que está correto, mas
não cobre **inserção forjada**. Numa trilha usada para prestação de contas de
LGPD, poder escrever em nome de terceiro esvazia a garantia.

Correção: `user_id = auth.uid()` no `WITH CHECK`, e `created_at` imposto por
trigger `before insert` em vez de default sobrescrevível.

### 3 — `clinics_update_admin` permite alterar `subscription_plan` e `slug` · **baixa**

`WITH CHECK` fixa apenas `id`. Um admin pode mudar o próprio plano de assinatura
pela API REST. Vale restringir as colunas mutáveis por policy ou trigger antes
do faturamento entrar (Fase 10).

### 4 — Drift de versão entre migrations locais e remotas · **média (operacional)**

| Local                                            | Remoto                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| `20260824000001_clinics_and_profiles`            | `20260824133959_clinics_and_profiles`            |
| `20260824000002_revoke_anon_from_auth_functions` | `20260824134046_revoke_anon_from_auth_functions` |

O conteúdo é o mesmo, mas as versões não batem e não existe
`supabase/config.toml` — o CLI nunca foi inicializado; as migrations foram
aplicadas pelo MCP. Um `supabase db push` hoje trataria os dois arquivos locais
como não aplicados e falharia em `create type ... already exists`.

Isso bloqueia a Fase 12 e qualquer segundo ambiente. Resolver renomeando os
arquivos locais para as versões remotas (ou reconciliando a tabela
`supabase_migrations.schema_migrations`) enquanto há só duas.

### 5 — Não existe CI · **média (processo)**

Não há `.github/workflows`. O quality gate que a Definition of Done exige em
toda fase só acontece se alguém rodar os quatro comandos à mão. Com 12 fases
pela frente e DoD por tela, é a lacuna com maior efeito composto.

### 6 — A auditoria de contraste não é reproduzível · **média**

O plano registra "auditoria de contraste WCAG AA no browser: 0 falhas (era 93)"
— resultado valioso, mas **nenhum script ou teste foi commitado**. Não existe
`axe` na suíte e2e nem verificação de contraste no Vitest.

O achado #18 mostra exatamente por que isso importa: uma regressão de
`tailwind-merge` derrubou 93 combinações e passou por lint e typecheck sem
ruído. O teste de regressão em `cn.test.ts` cobre aquele bug específico, não a
propriedade "nenhuma combinação abaixo de 4.5:1". A próxima regressão de
contraste volta a ser invisível.

### 7 — A suíte e2e não executa neste ambiente · **baixa**

`npx playwright test` → 8 de 8 falham antes de qualquer asserção:

```
Failed to launch chromium ... chromium_headless_shell-1234
```

O Playwright 1.62.1 pede a revisão 1234; a imagem traz a 1194. As falhas são de
browser ausente, não de asserção — mas significa que os quatro testes de shell
nunca rodaram aqui. Também não fazem parte do gate declarado.

### 8 — `Modal` usa `id` fixo · **baixa**

`modal.tsx` marca `<h2 id="modal-title">` e aponta `aria-labelledby="modal-title"`.
O `<dialog>` é renderizado sempre, aberto ou não — logo, **duas instâncias de
`Modal` na mesma página produzem dois elementos com o mesmo `id`**, e o
`aria-labelledby` deixa de resolver de forma determinística. Usar `useId()`.

### 9 — `Modal` fecha ao clicar no próprio padding · **baixa**

O fechamento por backdrop compara `event.target === ref.current`. Como o
`<dialog>` é ele próprio a caixa (`p-6`, `flex flex-col gap-5`), o alvo é o
dialog também quando o clique cai nos 24px de padding ou nos 20px de gap entre
as seções — dentro do modal. Envolver o conteúdo numa `div` interna resolve.

### 10 — Cobertura de teste concentrada nos componentes simples · **baixa**

8 dos 24 componentes de `ui/` têm teste: Button, Input, Checkbox, IconButton,
Toast, Badge, Avatar, Tabs.

Sem teste: **Modal, Sheet, Select, Switch, Tooltip, Table**, além dos estados
(Empty, Error, Skeleton, Processing) e do AlertBanner. São justamente os de
comportamento mais complexo — focus trap, Escape, restauração de foco,
`translateY` com backdrop blur — e são exatamente os comportamentos que a DoD
da Fase 2 declara atendidos. Os dois bugs de `Modal` acima teriam sido pegos.

### 11 — `middleware.ts` prometido mas inexistente · **informativo**

`server/supabase/server.ts` justifica ignorar falha de escrita de cookie com
"o middleware faz o refresh da sessão". Não há middleware no repositório.
Correto para a Fase 1 — é dívida a saldar na Fase 3, e o comentário deve deixar
claro que descreve o destino, não o presente.

### 12 — A área `(app)` inteira é pública · **informativo**

As 11 rotas do shell renderizam sem sessão, com `PLACEHOLDER_PROFILE`. Está
documentado e é o esperado da Fase 1, mas é o que um deploy de hoje exporia.
Fase 3 é pré-requisito de qualquer ambiente acessível.

### 13 — `env.ts` não falha no build · **informativo**

`npm run build` conclui **sem nenhuma variável de ambiente definida**: as 14
rotas estáticas não importam o cliente Supabase, e só `/api/health` é dinâmica.
A validação existe e está correta, mas a promessa de "falhar no boot" só se
cumpre no primeiro request que toque o Supabase — não no build nem no deploy.

### 14 — `/api/health` reporta RLS de forma enganosa · **informativo**

`rlsBlocksAnonymousRead` deriva de `count === 0`. Com sessão válida, a leitura
devolve a clínica do usuário e o campo vira `false` — o que parece falha de RLS
sendo o comportamento correto. Vale renomear ou forçar a checagem anônima.

### 15 — Grafia da marca inconsistente · **cosmético**

Convivem "Serenit**à**" (metadata, tokens, docs) e "Serenit**á**"
(`PLACEHOLDER_CLINIC.name`, dashboard, e2e). O e2e já depende da segunda forma.

### 16 — `rls_auto_enable()` não consta de migration alguma · **informativo**

O linter de segurança do Supabase sinaliza a função como `SECURITY DEFINER`
executável por `anon`. Ela **não é do projeto** — é um event trigger da
plataforma que habilita RLS automaticamente em toda tabela nova de `public`.
Como devolve `event_trigger`, não é invocável por RPC; o aviso é ruído. Os
outros três avisos do linter (`current_clinic_id`, `current_profile_role`,
`is_clinical_role` executáveis por `authenticated`) são intencionais e já
tratados pela migration `...0002`.

---

## Recomendação de ordem

Antes de abrir a Fase 3:

1. Achados **1** e **2** — as duas policies. São duas linhas de SQL, e ambas
   ficam mais caras depois que houver dado clínico.
2. Achado **4** — reconciliar as versões das migrations enquanto são duas.
3. Achado **5** — workflow de CI com os quatro comandos do gate.

Junto com a Fase 3, que já prevê a suíte de testes de RLS (ADR 001): escrever o
teste que exercita a auto-promoção do achado 1 antes da correção, para que ele
falhe primeiro.

Fica para a Fase 11, sem urgência: achados 6, 7 e 10 (contraste automatizado,
browser do Playwright, cobertura dos componentes de comportamento).
