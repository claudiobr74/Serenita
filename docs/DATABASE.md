# DATABASE.md — Serenità

Schema, migrations e convenções de banco.

Modelo normativo: `10 — DEV HANDOFF / Data Model` do Figma (12:692).
Decisões: [`adr/001-multi-tenancy.md`](adr/001-multi-tenancy.md) e
`DESIGN_DECISIONS.md` #10.

---

## Migrations

`supabase/migrations/` é a **única fonte de verdade do schema**. Nenhuma
alteração estrutural é feita manualmente no painel do Supabase.

Nomenclatura: `AAAAMMDDNNNNNN_descricao.sql`.

| Migration                                 | Conteúdo                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `20260824000001_clinics_and_profiles.sql` | `clinics`, `profiles`, enum `profile_role`, funções de autorização, `audit_log`, RLS |

Migrations futuras seguem as fases de `IMPLEMENTATION_PLAN.md`.

---

## Regra: RLS junto com a tabela

Toda tabela sensível recebe `enable row level security` e `force row level
security` na **mesma migration** que a cria. Uma tabela sensível não existe sem
policy.

`force row level security` garante que nem o dono da tabela escapa das
policies — importante para a imutabilidade de `audit_log`.

---

## Funções de autorização

```sql
current_clinic_id()   -- clinic_id do perfil autenticado
current_role()        -- papel do perfil autenticado
is_clinical_role()    -- current_role() = 'psychologist'
```

Declaradas `SECURITY DEFINER` com `search_path` fixo e `STABLE`. O `DEFINER` é
necessário porque elas leem `profiles`, que tem RLS — sem ele haveria recursão
infinita entre policy e função.

**Toda policy se ancora nestas funções**, nunca em join ad-hoc e nunca em valor
vindo do cliente. Trocar o modelo de tenancy no futuro significa reescrever
estas três funções, não as dezenas de policies.

`execute` é revogado de `public` e concedido apenas a `authenticated`.

---

## Convenções

| Convenção      | Regra                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Chave primária | `uuid` com `gen_random_uuid()`, exceto `audit_log` (identity) e `profiles` (= `auth.users.id`) |
| Tenancy        | `clinic_id` explícito em toda tabela organizacional, mesmo quando derivável por join           |
| Timestamps     | `created_at` e `updated_at` em `timestamptz`, com trigger `touch_updated_at`                   |
| Soft delete    | `archived_at` + `archived_by`. Registro clínico nunca é apagado silenciosamente                |
| Enums          | Tipos Postgres nativos, espelhados em `src/domain/*/types.ts`                                  |
| JSONB          | Só para dados genuinamente sem forma fixa (`settings`, `metadata`)                             |
| Nomes          | `snake_case`, tabelas no plural                                                                |

### Por que `clinic_id` redundante

`clinical_records` chega a `clinics` via `patients`, mas carrega `clinic_id`
mesmo assim. A redundância é deliberada: torna a policy de RLS uma comparação
direta, sem join — mais rápida e muito mais difícil de escrever errado.

O custo é que a coluna precisa ser preenchida corretamente na escrita. Mitigado
por `WITH CHECK` em toda policy de `INSERT`.

---

## Tabelas planejadas

Conforme o Data Model do Figma. As não implementadas chegam nas fases indicadas.

| Tabela             | Fase | Papel                                            |
| ------------------ | ---- | ------------------------------------------------ |
| `clinics`          | 1 ✅ | Raiz multi-tenant                                |
| `profiles`         | 1 ✅ | Perfil de usuário, 1:1 com `auth.users`          |
| `audit_log`        | 1 ✅ | Trilha imutável, insert-only                     |
| `patients`         | 4    | Pacientes. RLS por clínica + psicólogo designado |
| `treatment_plans`  | 4    | Planos terapêuticos                              |
| `clinical_records` | 4    | Registros clínicos, criptografados em repouso    |
| `sessions`         | 5    | Consultas, ligadas a eventos do Google Calendar  |
| `documents`        | 9    | Documentos gerados                               |
| `consents`         | 9    | Consentimentos LGPD com assinatura               |
| `invoices`         | 10   | Financeiro                                       |
| `tasks`            | 10   | Pendências                                       |

### Adição ao modelo do Figma

`patients.display_code` — o identificador `PAC-###` aparece nas telas mas não
tem coluna no Data Model. Gerado por sequência **por clínica**, imutável,
`UNIQUE (clinic_id, display_code)`. Ver `DESIGN_DECISIONS.md` #12.

Nenhuma coluna declarada pelo Figma foi removida ou renomeada.

---

## `audit_log` — imutabilidade

Sem policy de `UPDATE` nem de `DELETE`. Como RLS nega por padrão o que não tem
policy, ambos são recusados. `force row level security` fecha a brecha do dono
da tabela.

Leitura restrita a `admin`, conforme a RBAC Matrix (`/auditoria` é rota Admin).

**Nunca armazena conteúdo clínico bruto** — apenas metadados seguros.

---

## Seed

`supabase/seed/` contém apenas **dados fictícios**, para desenvolvimento.

Nunca criar dados clínicos reais, nem em ambiente de desenvolvimento.

---

## Testes de RLS

Categoria própria na suíte, com um caso por cenário:

- clínica A tentando ler dados da clínica B — select, update, delete, e por ID conhecido
- `secretary` tentando acessar registro clínico
- **`admin` tentando acessar registro clínico** — deve falhar
- usuário sem perfil
- usuário arquivado
- `INSERT` tentando forjar `clinic_id` de outra clínica
- tentativa de `UPDATE`/`DELETE` em `audit_log`
- tentativa de auto-promoção de papel em `profiles`

Ver `TESTING.md`.
