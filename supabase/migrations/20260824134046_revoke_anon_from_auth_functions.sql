-- ============================================================================
-- 20260824000002 — Revogar `anon` das funções de autorização
--
-- A migration anterior fez `revoke execute ... from public`, mas o Supabase
-- concede privilégios a `anon` e `authenticated` explicitamente, não pela
-- pseudo-role PUBLIC. O resultado é que as três funções ficavam expostas em
-- `/rest/v1/rpc/*` para requisições não autenticadas — sinalizado pelo
-- database linter (`anon_security_definer_function_executable`).
--
-- Elas não vazam dado (sem `auth.uid()` retornam NULL), mas função
-- SECURITY DEFINER não deve ser alcançável por quem não fez login. Ver
-- docs/AUTHORIZATION.md.
-- ============================================================================

revoke execute on function public.current_clinic_id() from anon;
revoke execute on function public.current_profile_role() from anon;
revoke execute on function public.is_clinical_role() from anon;
