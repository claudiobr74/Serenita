-- ============================================================================
-- 20260825102728 — Funções de trigger saem da API pública
--
-- Achado do linter do Supabase (`anon_security_definer_function_executable` e
-- `authenticated_security_definer_function_executable`): as funções de trigger
-- do schema `public` estavam com `EXECUTE` para `anon` e `authenticated`, e
-- portanto apareciam como RPC em `/rest/v1/rpc/`.
--
-- **Não era explorável.** Uma função `returns trigger` chamada fora de um
-- trigger levanta erro no primeiro comando — o PL/pgSQL nem chega ao corpo. Mas
-- é superfície de API que não precisa existir, e num produto que guarda
-- prontuário a régua é essa.
--
-- O revoke NÃO afeta os triggers: o Postgres checa `EXECUTE` no `CREATE
-- TRIGGER`, não a cada disparo. A suíte de RLS confirma — os cenários 37
-- (`patients_before_insert`), 51–54 (`patient_clinical_record_revise`) e todo
-- UPDATE que passa por `touch_updated_at` continuam verdes.
--
-- ATENÇÃO para as próximas migrations: o Supabase mantém
-- `alter default privileges in schema public grant all on functions to anon,
-- authenticated`. Toda função de trigger nova nasce exposta de novo, e precisa
-- do mesmo revoke.
-- ============================================================================

revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.patients_before_insert() from public, anon, authenticated;
revoke execute on function public.patient_clinical_record_revise() from public, anon, authenticated;
