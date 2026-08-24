-- ============================================================================
-- 20260824190106 — Dados de clínica do onboarding, e convites de membro
--
-- Fonte: frames `onboarding-clinica` (6:5213) e `usuarios-permissoes` (6:4989).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Colunas de identidade da clínica
--
-- O passo 1 do onboarding coleta CNPJ, endereço, telefone e tipo de atuação.
-- Vão como COLUNAS, e não dentro de `settings`: são dados de identidade do
-- negócio, entram em documento e recibo (Fase 9 e 10) e precisam ser
-- consultáveis. `settings` fica para preferência.
-- ----------------------------------------------------------------------------
create type public.clinic_kind as enum ('individual', 'multi_professional');

alter table public.clinics
  add column cnpj    text,
  add column address text,
  add column phone   text,
  add column kind    public.clinic_kind,
  -- Marca a conclusão do wizard. Nulo = onboarding pendente.
  add column onboarding_completed_at timestamptz;

-- 14 dígitos, sem máscara. A formatação é da apresentação.
alter table public.clinics
  add constraint clinics_cnpj_formato check (cnpj is null or cnpj ~ '^[0-9]{14}$');

comment on column public.clinics.cnpj is
  'Somente dígitos. A máscara 00.000.000/0001-00 é aplicada na exibição.';

-- ----------------------------------------------------------------------------
-- invitations — convite de membro
--
-- O frame mostra a linha "Convite Pendente" na tabela de membros, com ação
-- "Cancelar convite". Um convite não é um perfil: existe antes de haver conta,
-- então não pode viver em `profiles`.
--
-- O token NUNCA é guardado em claro. Guardamos o SHA-256; quem tem o banco não
-- consegue forjar um link de convite válido.
-- ----------------------------------------------------------------------------
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  clinic_id   uuid          not null references public.clinics (id) on delete cascade,
  email       text          not null check (position('@' in email) > 1),
  role        profile_role  not null,
  invited_by  uuid          references public.profiles (id),
  token_hash  text          not null unique,
  expires_at  timestamptz   not null,
  accepted_at timestamptz,
  revoked_at  timestamptz,
  created_at  timestamptz   not null default now()
);

create index invitations_clinic_idx on public.invitations (clinic_id, created_at desc);

-- Um convite pendente por e-mail e clínica. Índice parcial: reconvidar depois
-- de revogar ou aceitar continua possível.
create unique index invitations_pendente_unico
  on public.invitations (clinic_id, lower(email))
  where accepted_at is null and revoked_at is null;

comment on column public.invitations.token_hash is
  'SHA-256 do token. O token em claro só existe no e-mail enviado.';

-- ----------------------------------------------------------------------------
-- RLS — invitations
--
-- Só admin da própria clínica. Convite carrega e-mail de pessoa e o papel que
-- ela terá: não é dado para qualquer membro ler.
--
-- Sem policy de DELETE: convite é revogado (`revoked_at`), preservando a
-- trilha de quem convidou quem. Mesma lógica do soft delete de `profiles`.
-- ----------------------------------------------------------------------------
alter table public.invitations enable row level security;
alter table public.invitations force row level security;

create policy invitations_select_admin
  on public.invitations for select
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.current_profile_role() = 'admin'
  );

create policy invitations_insert_admin
  on public.invitations for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and public.current_profile_role() = 'admin'
    and invited_by = auth.uid()
  );

create policy invitations_update_admin
  on public.invitations for update
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.current_profile_role() = 'admin'
  )
  with check (clinic_id = public.current_clinic_id());

-- `created_at` e `invited_by` não negociáveis, pela mesma razão de audit_log.
create or replace function public.invitations_force_created_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.created_at := now();
  return new;
end;
$$;

create trigger invitations_force_created_at
  before insert on public.invitations
  for each row execute function public.invitations_force_created_at();
