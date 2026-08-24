-- ============================================================================
-- 20260824000001 — Fundação multi-tenant: clinics, profiles, RBAC, RLS
--
-- Fonte do modelo: Figma `10 — DEV HANDOFF / Data Model` (12:692).
-- Decisões:  docs/adr/001-multi-tenancy.md
--            docs/DESIGN_DECISIONS.md #10
--
-- RLS é habilitada junto com a criação de cada tabela, nunca depois.
-- Uma tabela sensível não existe sem policy.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Papéis
--
-- Fonte: RBAC Matrix do Figma (`04 — INFORMATION ARCHITECTURE`, 12:585).
-- ----------------------------------------------------------------------------
create type public.profile_role as enum ('psychologist', 'admin', 'secretary');

-- ----------------------------------------------------------------------------
-- clinics — raiz de tenancy
-- ----------------------------------------------------------------------------
create table public.clinics (
  id                uuid primary key default gen_random_uuid(),
  name              text        not null check (length(trim(name)) > 0),
  slug              text        not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  logo_url          text,
  settings          jsonb       not null default '{}'::jsonb,
  subscription_plan text        not null default 'free',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.clinics is
  'Raiz multi-tenant. Todo dado organizacional é escopado por clinic_id.';

-- ----------------------------------------------------------------------------
-- profiles — perfil de usuário, 1:1 com auth.users
--
-- Um perfil pertence a exatamente uma clínica, com exatamente um papel.
-- Sem multi-membership. Ver docs/DESIGN_DECISIONS.md #10 para a justificativa
-- e para o caminho de reversão.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  clinic_id       uuid          not null references public.clinics (id) on delete restrict,
  full_name       text          not null check (length(trim(full_name)) > 0),
  role            profile_role  not null,
  avatar_url      text,
  specializations text[]        not null default '{}',
  crp             text,
  phone           text,
  settings        jsonb         not null default '{}'::jsonb,
  -- Soft delete: perfil removido perde acesso mas preserva a trilha de
  -- auditoria. Ver ARCHITECTURE.md §14.
  archived_at     timestamptz,
  archived_by     uuid          references public.profiles (id),
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

create index profiles_clinic_id_idx on public.profiles (clinic_id);

comment on column public.profiles.crp is
  'Registro no Conselho Regional de Psicologia. Relevante apenas para role = psychologist.';

-- ----------------------------------------------------------------------------
-- Funções auxiliares de autorização
--
-- Toda policy se ancora nestas funções, nunca em join ad-hoc nem em valor
-- vindo do cliente. Trocar o modelo de tenancy no futuro significa reescrever
-- estas três funções — não as policies.
--
-- SECURITY DEFINER com search_path fixo: as funções leem `profiles`, que tem
-- RLS. Sem DEFINER haveria recursão infinita entre policy e função.
-- ----------------------------------------------------------------------------
create or replace function public.current_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.clinic_id
  from public.profiles p
  where p.id = auth.uid()
    and p.archived_at is null;
$$;

create or replace function public.current_profile_role()
returns profile_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.archived_at is null;
$$;

-- Nota: a função se chama `current_profile_role` e não `current_role` porque
-- `current_role` é uma função embutida e palavra reservada do Postgres.

-- Acesso a conteúdo clínico.
--
-- ATENÇÃO: `admin` NÃO tem acesso clínico. A RBAC Matrix do Figma é explícita:
-- "Cannot access clinical records (HIPAA/LGPD compliance)". É mais restritivo
-- que o padrão da indústria e é fácil de "corrigir" por engano.
create or replace function public.is_clinical_role()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.current_profile_role() = 'psychologist';
$$;

revoke execute on function public.current_clinic_id() from public;
revoke execute on function public.current_profile_role() from public;
revoke execute on function public.is_clinical_role() from public;
grant execute on function public.current_clinic_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_clinical_role() to authenticated;

-- ----------------------------------------------------------------------------
-- updated_at
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger clinics_touch_updated_at
  before update on public.clinics
  for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — clinics
-- ----------------------------------------------------------------------------
alter table public.clinics enable row level security;
alter table public.clinics force row level security;

create policy clinics_select_own
  on public.clinics for select
  to authenticated
  using (id = public.current_clinic_id());

-- Só admin altera a própria clínica. A criação de clínica acontece no
-- onboarding, por um caminho server-side privilegiado (Fase 3).
create policy clinics_update_admin
  on public.clinics for update
  to authenticated
  using (id = public.current_clinic_id() and public.current_profile_role() = 'admin')
  with check (id = public.current_clinic_id());

-- ----------------------------------------------------------------------------
-- RLS — profiles
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profiles force row level security;

-- Todo membro enxerga os colegas da própria clínica (necessário para atribuir
-- paciente a psicólogo, exibir autoria, etc.). Sem vazamento cross-tenant.
create policy profiles_select_same_clinic
  on public.profiles for select
  to authenticated
  using (clinic_id = public.current_clinic_id());

-- Cada um edita o próprio perfil, mas não pode se promover: o papel precisa
-- permanecer igual. Escalação de privilégio é bloqueada no banco, não só na UI.
create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and clinic_id = public.current_clinic_id()
    and role = public.current_profile_role()
  );

create policy profiles_insert_admin
  on public.profiles for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and public.current_profile_role() = 'admin'
  );

create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (clinic_id = public.current_clinic_id() and public.current_profile_role() = 'admin')
  with check (clinic_id = public.current_clinic_id());

-- Sem policy de DELETE: perfil é arquivado (archived_at), nunca apagado.
-- Ver ARCHITECTURE.md §14.

-- ----------------------------------------------------------------------------
-- audit_log — trilha imutável, insert-only
--
-- Criada já nesta migration porque mudanças de permissão (Fase 3) precisam ser
-- auditadas desde o primeiro dia.
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id            bigint generated always as identity primary key,
  clinic_id     uuid        not null references public.clinics (id) on delete restrict,
  user_id       uuid        references public.profiles (id),
  action        text        not null,
  resource_type text        not null,
  resource_id   text,
  -- Metadados seguros apenas. NUNCA conteúdo clínico bruto.
  -- Ver ARCHITECTURE.md §13.
  metadata      jsonb       not null default '{}'::jsonb,
  ip_address    inet,
  created_at    timestamptz not null default now()
);

create index audit_log_clinic_created_idx
  on public.audit_log (clinic_id, created_at desc);
create index audit_log_resource_idx
  on public.audit_log (clinic_id, resource_type, resource_id);

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

-- Leitura restrita a admin, conforme a RBAC Matrix: `/auditoria` é rota Admin.
create policy audit_log_select_admin
  on public.audit_log for select
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.current_profile_role() = 'admin'
  );

create policy audit_log_insert_same_clinic
  on public.audit_log for insert
  to authenticated
  with check (clinic_id = public.current_clinic_id());

-- Imutabilidade: sem policy de UPDATE ou DELETE, ambos são negados por RLS
-- para qualquer role que não contorne RLS. `force row level security` garante
-- que nem o dono da tabela escapa.
