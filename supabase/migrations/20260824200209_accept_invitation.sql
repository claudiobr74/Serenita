-- ============================================================================
-- 20260824200209 — Aceite de convite
--
-- Quem aceita ainda NÃO é membro, então não pode inserir em `profiles`:
-- `profiles_insert_admin` exige ser admin da clínica. É o mesmo ovo-e-galinha
-- do provisionamento, mas aqui não cabe script operado por pessoa — é o
-- convidado que age.
--
-- A saída é uma função `SECURITY DEFINER`: a lógica fica no banco, atômica,
-- e a aplicação não precisa da chave `service_role`.
--
-- REGRA CENTRAL DE SEGURANÇA: o token sozinho NÃO basta.
--
-- Aceitar exige token válido **e** sessão autenticada cujo e-mail seja o do
-- convite. Quem intercepta o link (encaminhamento, log de proxy, histórico de
-- browser) não entra sem também controlar a caixa postal. É por isso que a
-- função não recebe e-mail como parâmetro: ela lê de `auth.users`.
-- ============================================================================

create or replace function public.accept_invitation(
  convite_token text,
  nome_completo text
)
returns uuid
language plpgsql
security definer
-- `extensions` no search_path por causa de `digest`; fixo para que a função
-- não possa ser sequestrada por um schema no caminho de quem chama.
set search_path = public, extensions, pg_temp
as $$
declare
  convite         public.invitations;
  email_da_sessao text;
  nome            text := trim(nome_completo);
begin
  if auth.uid() is null then
    raise exception 'sem_sessao' using errcode = '28000';
  end if;

  if nome is null or length(nome) = 0 then
    raise exception 'nome_obrigatorio' using errcode = '22023';
  end if;

  -- Busca pelo HASH: o token em claro nunca esteve no banco.
  select * into convite
    from public.invitations
   where token_hash = encode(digest(convite_token, 'sha256'), 'hex')
     and accepted_at is null
     and revoked_at is null
   limit 1;

  if not found then
    -- Mensagem única para inexistente, já aceito e revogado: distinguir
    -- transformaria a rota num oráculo de convites válidos.
    raise exception 'convite_invalido' using errcode = '22023';
  end if;

  if convite.expires_at <= now() then
    raise exception 'convite_expirado' using errcode = '22023';
  end if;

  select u.email into email_da_sessao from auth.users u where u.id = auth.uid();

  if email_da_sessao is null
     or lower(email_da_sessao) <> lower(convite.email) then
    raise exception 'email_divergente' using errcode = '42501';
  end if;

  -- Um perfil pertence a exatamente uma clínica (DESIGN_DECISIONS #10).
  if exists (select 1 from public.profiles p where p.id = auth.uid()) then
    raise exception 'ja_tem_perfil' using errcode = '23505';
  end if;

  insert into public.profiles (id, clinic_id, full_name, role)
  values (auth.uid(), convite.clinic_id, nome, convite.role);

  -- Marca aceito ANTES de devolver, na mesma transação: se algo falhar depois,
  -- o convite não fica queimado.
  update public.invitations
     set accepted_at = now()
   where id = convite.id;

  insert into public.audit_log (clinic_id, user_id, action, resource_type, resource_id, metadata)
  values (convite.clinic_id, auth.uid(), 'invitation.accepted', 'invitation',
          convite.id::text, jsonb_build_object('papel', convite.role));

  return convite.clinic_id;
end;
$$;

-- `anon` não pode chamar: aceitar exige sessão, e a checagem de `auth.uid()`
-- dentro da função não deve ser a única barreira.
revoke execute on function public.accept_invitation(text, text) from public, anon;
grant  execute on function public.accept_invitation(text, text) to authenticated;

comment on function public.accept_invitation(text, text) is
  'Troca um token de convite pelo perfil. Exige sessão cujo e-mail seja o do convite — o token sozinho não basta.';
