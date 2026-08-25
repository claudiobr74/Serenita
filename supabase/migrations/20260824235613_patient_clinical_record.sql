-- ============================================================================
-- 20260824235613 — Prontuário: as seções e o histórico que a lei exige
--
-- Fonte: frame `prontuario` (6:1658), quatro seções colapsáveis:
--
--   1. Identificação Demográfica
--   2. Demanda Inicial
--   3. História Clínica e Familiar
--   4. Avaliação Diagnóstica Inicial
--
-- Duas decisões estruturais aqui.
--
-- **A "Demanda Inicial" sai do acolhimento e vem para o prontuário.**
-- `patient_clinical_intake.initial_complaint` guardava a mesma coisa que a
-- seção 2 do frame. Manter as duas criaria duas fontes de verdade para o campo
-- clínico mais consultado do produto: o cadastro mostraria uma versão e o
-- prontuário outra, e ninguém saberia qual vale. O acolhimento continua dono
-- da abordagem e da frequência sugerida — que são parâmetros do atendimento,
-- não registro clínico evolutivo.
--
-- **Prontuário não se sobrescreve em silêncio.** O autosave de 30s do
-- `03 — PATTERNS` faz UPDATE o tempo todo; sem histórico, uma edição
-- acidental apaga registro clínico sem deixar rastro. A Resolução CFP 001/2009
-- trata o prontuário como documento preservável. Daí
-- `patient_clinical_record_revision`, append-only e escrita SÓ por trigger.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Seções — enum, e não texto livre
--
-- O frame define quatro, e a ordem importa: é a ordem de leitura clínica. Um
-- `text` deixaria a UI e o banco discordarem sobre quais seções existem.
-- ----------------------------------------------------------------------------
create type public.clinical_record_section as enum (
  'demographic_identification',
  'initial_complaint',
  'clinical_family_history',
  'initial_diagnostic_assessment'
);

create table public.patient_clinical_record (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  clinic_id  uuid not null references public.clinics (id) on delete restrict,
  section    public.clinical_record_section not null,

  -- `''` em vez de null: seção existente e vazia é o estado normal de um
  -- prontuário recém-aberto, não ausência de informação.
  content    text not null default '',

  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (patient_id, section)
);

comment on table public.patient_clinical_record is
  'Prontuário por seção (6:1658). Conteúdo CLÍNICO: somente o psicólogo designado. Admin e secretária nunca leem.';

create index patient_clinical_record_patient_idx
  on public.patient_clinical_record (patient_id);

create trigger patient_clinical_record_touch_updated_at
  before update on public.patient_clinical_record
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Histórico de revisão — o trilho "Histórico de Revisão" de 6:1646
--
-- Guarda o conteúdo ANTERIOR a cada alteração, com quem o escreveu. É a mesma
-- lição de `audit_log`: histórico que o cliente pode escrever não é histórico.
-- Esta tabela não tem policy de INSERT, UPDATE nem DELETE — nenhuma. A única
-- escrita possível é a do trigger abaixo, que roda como dono da tabela.
-- ----------------------------------------------------------------------------
create table public.patient_clinical_record_revision (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.patient_clinical_record (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  clinic_id  uuid not null references public.clinics (id) on delete restrict,

  content    text not null,
  author_id  uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

comment on table public.patient_clinical_record_revision is
  'Versões anteriores de cada seção do prontuário. Append-only: escrita exclusiva do trigger patient_clinical_record_revise().';

create index patient_clinical_record_revision_record_idx
  on public.patient_clinical_record_revision (record_id, created_at desc);

-- ----------------------------------------------------------------------------
-- O trigger de revisão, e por que ele coalesce
--
-- Autosave dispara UPDATE a cada 30s de digitação. Uma revisão por UPDATE
-- encheria a tabela de versões que diferem por meia frase e tornaria o
-- histórico ilegível — que é justamente o oposto do objetivo.
--
-- Então: arquiva a versão anterior quando o conteúdo muda de fato E ou bem o
-- autor mudou, ou ainda não há revisão recente deste autor. A janela de 15
-- minutos faz uma sessão de escrita virar uma entrada.
--
-- A condição de autor não é enfeite: sem ela, quando um segundo profissional
-- sobrescreve o texto, a versão final do primeiro seria descartada por
-- coalescência — perdendo exatamente a versão que o histórico existe para
-- guardar.
--
-- `security definer` porque a tabela de revisão não tem policy de INSERT.
-- ----------------------------------------------------------------------------
create or replace function public.patient_clinical_record_revise()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.content is not distinct from old.content then
    return new;
  end if;

  if old.updated_by is distinct from new.updated_by
     or not exists (
       select 1
         from public.patient_clinical_record_revision r
        where r.record_id = old.id
          and r.author_id is not distinct from old.updated_by
          and r.created_at > now() - interval '15 minutes'
     ) then
    insert into public.patient_clinical_record_revision
      (record_id, patient_id, clinic_id, content, author_id)
    values
      (old.id, old.patient_id, old.clinic_id, old.content, old.updated_by);
  end if;

  return new;
end;
$$;

-- `before update`, e não `after`: o conteúdo antigo só existe em `old`.
create trigger patient_clinical_record_revise
  before update on public.patient_clinical_record
  for each row execute function public.patient_clinical_record_revise();

-- ----------------------------------------------------------------------------
-- RLS — o mesmo par de condições de `patient_clinical_intake`
--
--   is_clinical_role()  -> exclui admin e secretária, por papel
--   assigned_...        -> exclui os demais psicólogos, por designação
--
-- `updated_by = auth.uid()` no WITH CHECK: sem isso, o psicólogo designado
-- poderia gravar a seção assinando como um colega — e o histórico de revisão
-- herdaria a autoria falsa.
-- ----------------------------------------------------------------------------
alter table public.patient_clinical_record enable row level security;
alter table public.patient_clinical_record force row level security;

create policy clinical_record_select
  on public.patient_clinical_record for select
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

create policy clinical_record_insert
  on public.patient_clinical_record for insert
  to authenticated
  with check (
    clinic_id = public.current_clinic_id()
    and public.is_clinical_role()
    and updated_by = auth.uid()
    and exists (
      select 1 from public.patients p
       where p.id = patient_id
         and p.assigned_psychologist_id = auth.uid()
    )
  );

create policy clinical_record_update
  on public.patient_clinical_record for update
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
  -- O WITH CHECK repete a condição inteira de propósito: sem ele a linha
  -- poderia ser movida para outro paciente ou outra clínica na própria
  -- atualização, saindo do alcance do USING que a autorizou.
  with check (
    clinic_id = public.current_clinic_id()
    and updated_by = auth.uid()
    and exists (
      select 1 from public.patients p
       where p.id = patient_id
         and p.assigned_psychologist_id = auth.uid()
    )
  );

-- Sem DELETE: prontuário não é apagado pela API.

alter table public.patient_clinical_record_revision enable row level security;
alter table public.patient_clinical_record_revision force row level security;

create policy clinical_record_revision_select
  on public.patient_clinical_record_revision for select
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

-- Nenhuma policy de INSERT/UPDATE/DELETE, deliberadamente. Ver acima.

-- ----------------------------------------------------------------------------
-- Migração da "Demanda Inicial"
--
-- Backfill antes do drop: a coluna some, o conteúdo não.
-- ----------------------------------------------------------------------------
insert into public.patient_clinical_record
  (patient_id, clinic_id, section, content, updated_by, created_at, updated_at)
select i.patient_id,
       i.clinic_id,
       'initial_complaint',
       i.initial_complaint,
       i.created_by,
       i.created_at,
       i.updated_at
  from public.patient_clinical_intake i
 where i.initial_complaint is not null
   and btrim(i.initial_complaint) <> '';

alter table public.patient_clinical_intake drop column initial_complaint;

comment on table public.patient_clinical_intake is
  'Parâmetros clínicos do acolhimento (abordagem, frequência). A demanda inicial virou seção do prontuário — ver patient_clinical_record.';
