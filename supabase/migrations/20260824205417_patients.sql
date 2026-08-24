-- ============================================================================
-- 20260824205417 — patients: cadastro de paciente
--
-- Fonte: frames `lista-pacientes` (6:496) e `novo-paciente` (6:5292).
--
-- DECISÃO ESTRUTURAL: esta tabela guarda **apenas dado cadastral**. Nada
-- clínico — nem prontuário, nem plano, nem evolução, nem pendência clínica.
--
-- É o que torna a regra "admin não acessa registro clínico" verificável por
-- TABELA, e não por coluna. Se conteúdo clínico morasse aqui, cada policy
-- precisaria mascarar colunas — algo que RLS não faz — e a regra viraria
-- disciplina de quem escreve o SELECT. As tabelas clínicas chegam nas fatias
-- seguintes, com `is_clinical_role()` nas suas próprias policies.
-- Ver docs/DESIGN_DECISIONS.md #36.
-- ============================================================================

create type public.patient_status as enum ('active', 'archived', 'discharged');
create type public.care_modality as enum ('in_person', 'online');

-- Contador de `display_code` por clínica. Fica em `clinics` para que o
-- incremento seja um UPDATE que trava a linha da clínica — dois cadastros
-- simultâneos não podem receber o mesmo PAC-###.
alter table public.clinics
  add column patient_seq integer not null default 0;

create table public.patients (
  id           uuid primary key default gen_random_uuid(),
  clinic_id    uuid not null references public.clinics (id) on delete restrict,

  -- `PAC-###`, sequencial por clínica. Não existe no Dev Handoff, mas as telas
  -- o exibem em toda linha (6:601). Ver docs/DESIGN_DECISIONS.md #12.
  display_code text not null,

  full_name    text not null check (length(trim(full_name)) > 0),

  -- Somente dígitos. A máscara 000.000.000-00 é da apresentação.
  cpf          text check (cpf is null or cpf ~ '^[0-9]{11}$'),
  birth_date   date,
  phone        text,
  email        text,

  status       public.patient_status not null default 'active',
  modality     public.care_modality,

  -- O psicólogo designado. É ele, e só ele, que terá acesso ao conteúdo
  -- clínico deste paciente nas fatias seguintes.
  assigned_psychologist_id uuid references public.profiles (id),

  created_by   uuid references public.profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index patients_display_code_unico
  on public.patients (clinic_id, display_code);

-- CPF único por clínica, e só quando informado. Duas clínicas podem atender a
-- mesma pessoa; a mesma clínica não deve cadastrá-la duas vezes.
create unique index patients_cpf_unico
  on public.patients (clinic_id, cpf)
  where cpf is not null;

create index patients_clinic_status_idx
  on public.patients (clinic_id, status, full_name);
create index patients_psicologo_idx
  on public.patients (clinic_id, assigned_psychologist_id);

comment on table public.patients is
  'Cadastro de paciente. NUNCA contém dado clínico — ver as tabelas da Fase 4/6.';

-- ----------------------------------------------------------------------------
-- display_code, imposto pelo servidor
--
-- `security definer` é indispensável: o trigger incrementa `clinics.patient_seq`
-- e, sem ele, bateria em `clinics_update_admin`, impedindo secretária e
-- psicólogo de cadastrar. Ver a migration 20260824205543, que corrige isso.
-- ----------------------------------------------------------------------------
create or replace function public.patients_before_insert()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  proximo integer;
begin
  update public.clinics
     set patient_seq = patient_seq + 1
   where id = new.clinic_id
  returning patient_seq into proximo;

  if proximo is null then
    raise exception 'clinica_inexistente' using errcode = '23503';
  end if;

  new.display_code := 'PAC-' || lpad(proximo::text, 3, '0');
  new.created_at := now();
  return new;
end;
$$;

create trigger patients_before_insert
  before insert on public.patients
  for each row execute function public.patients_before_insert();

create trigger patients_touch_updated_at
  before update on public.patients
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
--
-- Quem enxerga o quê, conforme a RBAC Matrix:
--
--   psychologist  os PRÓPRIOS pacientes — não navega os de colegas
--   admin         todos, mas o conteúdo clínico não mora aqui
--   secretary     todos, para agendar e cadastrar
-- ----------------------------------------------------------------------------
alter table public.patients enable row level security;
alter table public.patients force row level security;

create policy patients_select
  on public.patients for select
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and (
      public.current_profile_role() in ('admin', 'secretary')
      or assigned_psychologist_id = auth.uid()
    )
  );

-- Os três papéis cadastram: a secretária faz recepção, o psicólogo cadastra o
-- próprio paciente, o admin opera a clínica.
create policy patients_insert
  on public.patients for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and created_by = auth.uid()
  );

create policy patients_update
  on public.patients for update
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and (
      public.current_profile_role() in ('admin', 'secretary')
      or assigned_psychologist_id = auth.uid()
    )
  )
  with check (clinic_id = public.current_clinic_id());

-- Sem policy de DELETE. A Fase 4 exige "exclusão com diálogo de confirmação e
-- aprovação de admin" — fluxo próprio, que não é um DELETE solto pela API.
-- Enquanto ele não existe, paciente sai de circulação por `status`.
