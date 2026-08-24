-- ============================================================================
-- 20260824180540 — Endurecimento de duas policies da migration inicial
--
-- Fonte: docs/REVIEW_FASES_0_2.md, achados 1 e 2. Ambas as falhas foram
-- reproduzidas contra o banco antes da correção, e a correção foi verificada
-- contra os mesmos ataques mais os casos legítimos que ela não podia quebrar.
--
-- A causa raiz é a mesma nos dois casos: policies permissivas do Postgres são
-- combinadas por OR. Um `WITH CHECK` estrito numa policy NÃO restringe quem já
-- é autorizado por outra.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1 — Admin não altera o próprio papel
--
-- Antes: `profiles_update_admin` tinha WITH CHECK apenas sobre `clinic_id`.
-- Como as policies são OR, o WITH CHECK de `profiles_update_self`
-- (`role = current_profile_role()`) — apontado em AUTHORIZATION.md como a
-- defesa contra escalação — não alcançava o admin, que podia executar
--
--     update profiles set role = 'psychologist' where id = auth.uid();
--
-- e com isso abrir o acesso clínico que a RBAC Matrix nega a admin
-- ("Cannot access clinical records — HIPAA/LGPD compliance").
--
-- Depois: admin segue gerindo o papel dos colegas; deixa de mexer no próprio.
-- Trocar o papel de um admin passa a exigir OUTRO admin — separação de
-- responsabilidade, e não apenas bloqueio.
--
-- `current_profile_role()` é STABLE e enxerga o snapshot do início do comando,
-- ou seja, o papel ANTERIOR à linha em atualização. É isso que torna a
-- comparação com o valor NOVO de `role` capaz de detectar a troca.
-- ----------------------------------------------------------------------------
drop policy profiles_update_admin on public.profiles;

create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.current_profile_role() = 'admin'
  )
  with check (
    clinic_id = public.current_clinic_id()
    and (id <> auth.uid() or role = public.current_profile_role())
  );

-- ----------------------------------------------------------------------------
-- 2 — Entrada de auditoria não pode ser forjada nem retroagida
--
-- Antes: o WITH CHECK fixava só `clinic_id`. Qualquer membro autenticado —
-- inclusive `secretary` — podia inserir uma entrada atribuída a OUTRO usuário
-- e com `created_at` arbitrário. Numa trilha usada para prestação de contas de
-- LGPD, poder escrever em nome de terceiro esvazia a garantia.
--
-- A ausência de policy de UPDATE/DELETE protegia a linha já gravada, mas nada
-- protegia a inserção.
--
-- Depois: a autoria é o próprio autor, e o horário é do servidor.
-- `service_role` contorna RLS e segue podendo registrar ação de sistema com
-- `user_id` nulo.
-- ----------------------------------------------------------------------------
drop policy audit_log_insert_same_clinic on public.audit_log;

create policy audit_log_insert_same_clinic
  on public.audit_log for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and user_id = auth.uid()
  );

-- `created_at` tinha apenas `default now()`, que o cliente sobrescreve
-- bastando informar a coluna. O trigger torna o horário não negociável.
create or replace function public.audit_log_force_created_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.created_at := now();
  return new;
end;
$$;

create trigger audit_log_force_created_at
  before insert on public.audit_log
  for each row execute function public.audit_log_force_created_at();
