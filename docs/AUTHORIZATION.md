# AUTHORIZATION.md — Serenità

Como o acesso é controlado.

Fonte normativa: RBAC Matrix do Figma (`04 — INFORMATION ARCHITECTURE`, 12:585).

---

## Papéis

| Papel          | Descrição                                                                                       | Acesso                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `psychologist` | Acesso clínico completo aos **próprios** pacientes. Não gerencia a clínica nem outros usuários. | Dashboard, Agenda, Pacientes (próprios), Sessões, Prontuário, Plano Terapêutico, Supervisor IA, Conhecimento, Financeiro (próprio), Documentos, Consentimentos, Pendências, Indicadores (próprios) |
| `admin`        | Administrador da clínica. Configurações, usuários, financeiro, auditoria.                       | Dashboard, Agenda (todas), Pacientes (todos, **sem clínico**), Financeiro (todos), Documentos, Consentimentos, Pendências, Indicadores (todos), Configurações, Usuários, Auditoria                 |
| `secretary`    | Recepção. Agendamento, cadastro, financeiro básico.                                             | Dashboard (limitado), Agenda (ver/editar), Pacientes (**cadastro apenas**), Pendências, Financeiro (ver recibos)                                                                                   |

## A regra mais fácil de errar

> **`admin` não acessa conteúdo clínico.**

A RBAC Matrix é explícita: _"Cannot access clinical records (HIPAA/LGPD
compliance)"_. Isso é mais restritivo que o modelo usual de "admin vê tudo" e
parece um bug para quem não leu a matriz.

Protegido em três lugares para que uma "correção" bem-intencionada não abra o
acesso silenciosamente:

1. `canAccessClinicalContent()` em `src/domain/auth/policy.ts`
2. Um teste unitário que falha se `admin` passar a ter acesso
3. Policies de RLS ancoradas em `is_clinical_role()`

---

## Três camadas independentes

Nenhuma camada confia na anterior.

### 1. UI — conveniência

Itens de navegação e ações fora do escopo do papel **não são renderizados**.
Não são desabilitados: um controle desabilitado revela que o recurso existe.

`navItemsForRole()` em `src/components/shell/nav-items.ts` filtra a sidebar. Cada
item declara qual predicado de `domain/auth/policy` o governa — a autorização não
é reimplementada ali.

**A UI nunca é mecanismo de segurança.**

### 2. Server — enforcement

Todo Server Action e route handler chama um guard de `domain/<dominio>/policy.ts`
antes de qualquer efeito.

As policies são funções puras, sem I/O, testadas unitariamente e reutilizadas
pela UI e pelo servidor — a mesma regra, uma definição só.

### 3. RLS — última linha

Mesmo que as camadas 1 e 2 falhem, o Postgres recusa. Ver
[`DATABASE.md`](DATABASE.md) e [`adr/001-multi-tenancy.md`](adr/001-multi-tenancy.md).

---

## Isolamento de tenant

Toda policy se ancora em `current_clinic_id()`, derivada do perfil do JWT.
**Nenhuma policy aceita `clinic_id` vindo do cliente.**

Em `INSERT`, o `WITH CHECK` força `clinic_id = current_clinic_id()`, impedindo
que uma escrita forje o tenant.

---

## Escalação de privilégio

Duas policies governam `UPDATE` em `profiles`, e **as duas** precisam pinar o
`role` — policies permissivas do Postgres são combinadas por **OR**, então um
`WITH CHECK` estrito numa delas não restringe quem já é autorizado pela outra.

- `profiles_update_self` — cada um edita o próprio perfil, com `WITH CHECK`
  exigindo `role = current_profile_role()`.
- `profiles_update_admin` — admin edita qualquer perfil da própria clínica,
  **exceto o papel do seu próprio**: `id <> auth.uid() or role =
current_profile_role()`.

Auto-promoção é bloqueada no banco, não apenas na UI — para todos os papéis,
`admin` inclusive. Trocar o papel de um admin exige **outro** admin, o que
torna a mudança um ato de duas pessoas em vez de um privilégio autoconcedido.

Isso importa porque `admin` não tem acesso clínico: sem a restrição, bastaria
um `update profiles set role = 'psychologist' where id = auth.uid()` para
contornar a regra inteira. Corrigido na migration `20260824180540`; ver
`docs/REVIEW_FASES_0_2.md` achado 1.

Apenas `admin` altera papéis, e apenas dentro da própria clínica.

---

## Permission denied

Sem tela desenhada no Figma. Resolução em `DESIGN_DECISIONS.md` #7:

- **Navegação:** o que está fora do escopo não é renderizado.
- **Acesso direto por URL:** estado de erro de página inteira, com cópia de "sem
  permissão", **sem revelar se o recurso existe**.

---

## `service_role`

A chave `SUPABASE_SECRET_KEY` contorna RLS. Portanto:

- **Nunca** prefixada com `NEXT_PUBLIC_`
- **Nunca** usada em Client Component
- Uso restrito a Edge Functions e route handlers onde contornar RLS é o
  comportamento pretendido — ex.: webhook do Google Calendar, que não tem sessão
  de usuário

Todo uso é justificado por comentário no ponto de uso.

---

## Ameaças cobertas

| Ameaça                           | Defesa                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| IDOR                             | RLS por `clinic_id`; ID conhecido não basta                                                 |
| Acesso cross-tenant              | `current_clinic_id()` em toda policy                                                        |
| Escalação de privilégio          | `WITH CHECK` sobre `role` nas **duas** policies de UPDATE de `profiles`                     |
| Admin lendo prontuário           | `is_clinical_role()` nas policies clínicas                                                  |
| Forja de tenant em escrita       | `WITH CHECK` sobre `clinic_id` em todo `INSERT`                                             |
| Adulteração de auditoria         | `audit_log` sem policy de UPDATE/DELETE + `force row level security`                        |
| Forja de entrada na auditoria    | `WITH CHECK` exige `user_id = auth.uid()`; `created_at` imposto por trigger                 |
| Vazamento de `service_role`      | Ausente do bundle do cliente; validado por `src/lib/env.ts`                                 |
| Forja de autoria no prontuário   | `WITH CHECK` exige `updated_by = auth.uid()` no INSERT e no UPDATE                          |
| Forja do histórico de revisão    | `patient_clinical_record_revision` sem policy de INSERT/UPDATE/DELETE; só o trigger escreve |
| Prontuário de paciente de colega | Policies clínicas exigem `is_clinical_role()` **e** `assigned_psychologist_id = auth.uid()` |

---

## Nota: `current_role` vs. `current_profile_role`

A função chama-se `current_profile_role()` e **não** `current_role()`, porque
`current_role` é uma função embutida e palavra reservada do Postgres.

---

## Aviso esperado do database linter

O linter do Supabase reporta
`authenticated_security_definer_function_executable` para
`current_clinic_id()`, `current_profile_role()` e `is_clinical_role()`.

**Isso é intencional e não deve ser "corrigido".** As policies de RLS rodam na
identidade do chamador e precisam que `authenticated` execute essas funções.
Convertê-las para `SECURITY INVOKER` causaria recursão infinita — elas leem
`profiles`, que tem RLS.

O que **foi** corrigido é o acesso anônimo: `anon` teve `execute` revogado na
migration `20260824000002`. Sem sessão as funções retornariam `NULL` de qualquer
forma, mas função `SECURITY DEFINER` não deve ser alcançável por quem não fez
login.
