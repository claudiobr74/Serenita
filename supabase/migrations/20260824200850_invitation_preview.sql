-- ============================================================================
-- 20260824200850 — Prévia do convite
--
-- A página `/convite/[token]` é pública — quem chega ainda não tem conta. Mas
-- `invitations_select_admin` só devolve linhas para admin, então sem isto a
-- página não tem como dizer sequer de qual clínica é o convite.
--
-- O que é revelado, e por quê:
--
--   nome da clínica  — sem isso a pessoa não sabe o que está aceitando
--   papel            — idem; aceitar às cegas é pior
--   e-mail           — a pessoa precisa saber com QUAL conta entrar
--
-- Nada disso agrava a exposição: quem chama já tem o token, que foi enviado
-- justamente para aquele e-mail. O que a função NÃO faz é confirmar validade
-- para quem chuta token: convite inexistente, revogado e já aceito devolvem a
-- mesma coisa — zero linhas — para não virar oráculo.
--
-- `id` e `clinic_id` ficam de fora de propósito: não são necessários para a
-- tela e seriam identificadores internos vazando para rota pública.
-- ============================================================================

create or replace function public.invitation_preview(convite_token text)
returns table (
  clinica text,
  papel   profile_role,
  email   text,
  expirado boolean
)
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select c.name, i.role, i.email, (i.expires_at <= now())
    from public.invitations i
    join public.clinics c on c.id = i.clinic_id
   where i.token_hash = encode(digest(convite_token, 'sha256'), 'hex')
     and i.accepted_at is null
     and i.revoked_at is null
   limit 1;
$$;

-- `anon` PRECISA chamar: a página é pública e quem chega ainda não tem conta.
revoke execute on function public.invitation_preview(text) from public;
grant  execute on function public.invitation_preview(text) to anon, authenticated;

comment on function public.invitation_preview(text) is
  'Prévia pública de um convite pendente, a partir do token. Devolve zero linhas para token inválido, revogado ou já aceito — sem distinguir entre eles.';
