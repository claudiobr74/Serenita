-- ============================================================================
-- 20260824205543 — O trigger de `display_code` precisa contornar a RLS de `clinics`
--
-- Encontrado no primeiro teste: a secretária não conseguia cadastrar paciente.
--
-- Causa: o trigger incrementa `clinics.patient_seq`, e sem `security definer`
-- ele roda com os privilégios de quem chama — batendo em
-- `clinics_update_admin`, que exige papel admin. Para secretária e psicólogo o
-- UPDATE afetava zero linhas, `proximo` vinha NULL, e o `raise` acusava
-- "clinica_inexistente" — mensagem enganosa, que apontava para o lugar errado.
--
-- Não amplia superfície: o contador só é incrementado para `new.clinic_id`, e
-- a policy de INSERT já exige `clinic_id = current_clinic_id()`. Um INSERT que
-- falhe na checagem desfaz o incremento junto, na mesma transação.
--
-- A mensagem de erro também deixa de mentir: se a clínica não existir, a chave
-- estrangeira é quem recusa.
-- ============================================================================

create or replace function public.patients_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  proximo integer;
begin
  -- O UPDATE trava a linha da clínica até o fim da transação, serializando
  -- cadastros concorrentes. `returning` evita um SELECT extra.
  update public.clinics
     set patient_seq = patient_seq + 1
   where id = new.clinic_id
  returning patient_seq into proximo;

  -- Chegar aqui com NULL agora significa clínica inexistente de verdade, e a
  -- FK de `patients.clinic_id` recusaria em seguida de qualquer modo.
  if proximo is null then
    raise exception 'clinic_id inexistente: %', new.clinic_id
      using errcode = '23503';
  end if;

  new.display_code := 'PAC-' || lpad(proximo::text, 3, '0');
  new.created_at := now();
  return new;
end;
$$;
