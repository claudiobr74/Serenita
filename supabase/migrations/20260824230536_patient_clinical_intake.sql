-- ============================================================================
-- 20260824230536 — Acolhimento clínico, e o que o cadastro NÃO deve guardar
--
-- Fonte: frame `novo-paciente` (6:5292), que tem três seções:
--
--   1. Dados Pessoais            -> cadastral, fica em `patients`
--   2. Informações Clínicas      -> CLÍNICO, vai para cá
--   3. Termos & Consentimentos   -> gate legal, fica em `patients`
--
-- A seção 2 pede "principais queixas, sintomas ou objetivos trazidos pelo
-- paciente" (6:5428). Isso é registro clínico. Se morasse em `patients`,
-- `patients_select` — que devolve linhas para admin e secretária — o
-- entregaria a quem a RBAC Matrix nega acesso clínico, e RLS não mascara
-- coluna.
--
-- É o primeiro caso concreto que valida a decisão #36: separar por TABELA, e
-- não por coluna, é o que torna a regra aplicável.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Colunas cadastrais que faltavam em `patients`
-- ----------------------------------------------------------------------------
alter table public.patients
  add column occupation text,
  -- Consentimentos da seção 3. São gates legais, não conteúdo clínico: dizem
  -- *que* houve consentimento, nunca o que foi dito em sessão.
  --
  -- A Fase 9 traz o fluxo completo de consentimento (draft/sent/signed/...),
  -- com versão assinada preservada. Estes campos não o substituem — são o gate
  -- que o ADR 003 §5 exige AGORA, antes de qualquer chamada a fornecedor de IA.
  add column tcle_accepted_at timestamptz,
  add column ai_consent_at    timestamptz;

comment on column public.patients.ai_consent_at is
  'Consentimento para processamento por IA. Gate verificado no servidor antes de qualquer chamada externa — ADR 003 §5.';

-- ----------------------------------------------------------------------------
-- patient_clinical_intake — a seção 2 do cadastro
-- ----------------------------------------------------------------------------
create table public.patient_clinical_intake (
  patient_id  uuid primary key references public.patients (id) on delete cascade,
  clinic_id   uuid not null references public.clinics (id) on delete restrict,

  therapeutic_approach text,
  suggested_frequency  text,
  -- "Demanda Inicial" (6:5427). Texto clínico livre.
  initial_complaint    text,

  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.patient_clinical_intake is
  'Conteúdo CLÍNICO do acolhimento. Somente o psicólogo designado. Admin e secretária nunca leem.';

create trigger patient_clinical_intake_touch_updated_at
  before update on public.patient_clinical_intake
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- RLS — o primeiro conjunto de policies verdadeiramente clínicas
--
-- Duas condições, ambas necessárias:
--
--   is_clinical_role()  -> exclui admin e secretária, por papel
--   assigned_...        -> exclui os demais psicólogos, por designação
--
-- A segunda não é redundante: sem ela, qualquer psicólogo da clínica leria o
-- acolhimento de pacientes de colegas.
-- ----------------------------------------------------------------------------
alter table public.patient_clinical_intake enable row level security;
alter table public.patient_clinical_intake force row level security;

create policy clinical_intake_select
  on public.patient_clinical_intake for select
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.is_clinical_role()
    and exists (
      select 1 from public.patients p
       where p.id = patient_id
         and p.assigned_psychologist_id = auth.uid()
    )
  );

create policy clinical_intake_insert
  on public.patient_clinical_intake for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and public.is_clinical_role()
    and created_by = auth.uid()
    and exists (
      select 1 from public.patients p
       where p.id = patient_id
         and p.assigned_psychologist_id = auth.uid()
    )
  );

create policy clinical_intake_update
  on public.patient_clinical_intake for update
  to authenticated
  using (
    clinic_id = public.current_clinic_id()
    and public.is_clinical_role()
    and exists (
      select 1 from public.patients p
       where p.id = patient_id
         and p.assigned_psychologist_id = auth.uid()
    )
  )
  with check (clinic_id = public.current_clinic_id());

-- Sem DELETE: registro clínico não é apagado pela API.
