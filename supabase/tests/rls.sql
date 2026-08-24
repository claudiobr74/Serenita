-- ============================================================================
-- Suíte de testes de RLS — exigida pelo ADR 001
--
-- Roda inteira dentro de uma transação e termina em ROLLBACK: não deixa dado
-- no banco e pode ser executada contra qualquer ambiente, inclusive um que já
-- tenha dados.
--
-- Como rodar:
--
--     psql "$SUPABASE_DB_URL" -f supabase/tests/rls.sql
--
-- Ou colando o conteúdo numa única execução de SQL (MCP do Supabase, SQL
-- Editor). O resultado é uma tabela de veredito; qualquer FALHOU levanta
-- exceção ao final, que aborta a transação e sinaliza erro para quem chamou.
--
-- Cada cenário aqui corresponde a uma linha da tabela de ameaças de
-- docs/AUTHORIZATION.md. Os três ataques de escalação vêm dos achados 1 e 2 de
-- docs/REVIEW_FASES_0_2.md, que foram falhas REAIS neste banco — o teste existe
-- para que não voltem.
-- ============================================================================

begin;

create temp table resultado (
  ordem    int,
  ameaca   text,
  cenario  text,
  esperado text,
  obtido   text
) on commit drop;

-- ----------------------------------------------------------------------------
-- Cenário: duas clínicas, com papéis distintos em cada.
-- ----------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('aaaa1111-1111-1111-1111-111111111111', 'admin.a@teste.local'),
  ('aaaa2222-2222-2222-2222-222222222222', 'psi.a@teste.local'),
  ('aaaa3333-3333-3333-3333-333333333333', 'sec.a@teste.local'),
  ('aaaa4444-4444-4444-4444-444444444444', 'admin.a2@teste.local'),
  ('bbbb1111-1111-1111-1111-111111111111', 'admin.b@teste.local');

insert into public.clinics (id, name, slug) values
  ('c1111111-1111-1111-1111-111111111111', 'Clinica A', 'clinica-a'),
  ('c2222222-2222-2222-2222-222222222222', 'Clinica B', 'clinica-b');

insert into public.profiles (id, clinic_id, full_name, role) values
  ('aaaa1111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Admin A',        'admin'),
  ('aaaa2222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'Psicologa A',    'psychologist'),
  ('aaaa3333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'Secretaria A',   'secretary'),
  ('aaaa4444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 'Admin A2',       'admin'),
  ('bbbb1111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'Admin B',        'admin');

-- A tabela de veredito precisa ser gravável pelos dois papéis, porque os
-- cenários alternam entre `authenticated` e `anon`.
grant all on resultado to authenticated, anon;
set local role authenticated;

do $$
declare
  admin_a  constant text := 'aaaa1111-1111-1111-1111-111111111111';
  psi_a    constant text := 'aaaa2222-2222-2222-2222-222222222222';
  sec_a    constant text := 'aaaa3333-3333-3333-3333-333333333333';
  admin_a2 constant text := 'aaaa4444-4444-4444-4444-444444444444';
  admin_b  constant text := 'bbbb1111-1111-1111-1111-111111111111';
  clinica_a constant uuid := 'c1111111-1111-1111-1111-111111111111';
  clinica_b constant uuid := 'c2222222-2222-2222-2222-222222222222';
  convite uuid;
  n int;
begin
  -- ==========================================================================
  -- Ameaça: escalação de privilégio
  -- ==========================================================================
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_a), true);

  begin
    update public.profiles set role = 'psychologist' where id = auth.uid();
    insert into resultado values (1, 'Escalacao de privilegio',
      'admin muda o proprio papel', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (1, 'Escalacao de privilegio',
      'admin muda o proprio papel', 'BLOQUEADO', 'BLOQUEADO');
  end;

  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', sec_a), true);
  begin
    update public.profiles set role = 'psychologist' where id = auth.uid();
    insert into resultado values (2, 'Escalacao de privilegio',
      'secretaria se promove', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (2, 'Escalacao de privilegio',
      'secretaria se promove', 'BLOQUEADO', 'BLOQUEADO');
  end;

  -- Gestao legitima de papeis: admin muda o papel de OUTRO.
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_a), true);
  begin
    update public.profiles set role = 'psychologist' where id = sec_a::uuid;
    insert into resultado values (3, 'Escalacao de privilegio',
      'admin muda papel de colega', 'PERMITIDO',
      case when (select role from public.profiles where id = sec_a::uuid)::text = 'psychologist'
           then 'PERMITIDO' else 'nao aplicou' end);
    -- restaura para nao contaminar os cenarios seguintes
    update public.profiles set role = 'secretary' where id = sec_a::uuid;
  exception when others then
    insert into resultado values (3, 'Escalacao de privilegio',
      'admin muda papel de colega', 'PERMITIDO', 'BLOQUEADO -- REGRESSAO');
  end;

  -- Separacao de responsabilidade: outro admin pode promover o primeiro.
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_a2), true);
  begin
    update public.profiles set role = 'psychologist' where id = admin_a::uuid;
    insert into resultado values (4, 'Escalacao de privilegio',
      'outro admin promove o primeiro', 'PERMITIDO',
      case when (select role from public.profiles where id = admin_a::uuid)::text = 'psychologist'
           then 'PERMITIDO' else 'nao aplicou' end);
    update public.profiles set role = 'admin' where id = admin_a::uuid;
  exception when others then
    insert into resultado values (4, 'Escalacao de privilegio',
      'outro admin promove o primeiro', 'PERMITIDO', 'BLOQUEADO -- REGRESSAO');
  end;

  -- ==========================================================================
  -- Ameaça: acesso cross-tenant / IDOR
  -- ==========================================================================
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_b), true);

  select count(*) into n from public.profiles where clinic_id = clinica_a;
  insert into resultado values (5, 'Acesso cross-tenant',
    'admin B enxerga perfis da clinica A', '0', n::text);

  select count(*) into n from public.clinics where id = clinica_a;
  insert into resultado values (6, 'IDOR',
    'admin B le a clinica A tendo o id', '0', n::text);

  begin
    update public.clinics set name = 'Sequestrada' where id = clinica_a;
    get diagnostics n = row_count;
    insert into resultado values (7, 'Acesso cross-tenant',
      'admin B altera a clinica A', '0 linhas', n::text || ' linhas');
  exception when others then
    insert into resultado values (7, 'Acesso cross-tenant',
      'admin B altera a clinica A', '0 linhas', '0 linhas');
  end;

  -- ==========================================================================
  -- Ameaça: forja de tenant em escrita
  -- ==========================================================================
  begin
    insert into public.audit_log (clinic_id, user_id, action, resource_type)
    values (clinica_a, admin_b::uuid, 'forjado', 'teste');
    insert into resultado values (8, 'Forja de tenant em escrita',
      'admin B grava auditoria na clinica A', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (8, 'Forja de tenant em escrita',
      'admin B grava auditoria na clinica A', 'BLOQUEADO', 'BLOQUEADO');
  end;

  -- ==========================================================================
  -- Ameaça: forja de entrada na auditoria
  -- ==========================================================================
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', sec_a), true);

  begin
    insert into public.audit_log (clinic_id, user_id, action, resource_type)
    values (clinica_a, admin_a::uuid, 'patient.deleted', 'patient');
    insert into resultado values (9, 'Forja de entrada na auditoria',
      'secretaria grava em nome do admin', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (9, 'Forja de entrada na auditoria',
      'secretaria grava em nome do admin', 'BLOQUEADO', 'BLOQUEADO');
  end;

  -- Registro legitimo da propria acao, com data retroativa tentada.
  insert into public.audit_log (clinic_id, user_id, action, resource_type, resource_id, created_at)
  values (clinica_a, sec_a::uuid, 'patient.created', 'patient', 'PAC-RLS', '2020-01-01T00:00:00Z');

  insert into resultado values (10, 'Forja de entrada na auditoria',
    'secretaria registra acao propria', 'PERMITIDO', 'PERMITIDO');

  -- ==========================================================================
  -- Ameaça: adulteração de auditoria
  -- ==========================================================================
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_a), true);

  insert into resultado values (11, 'Adulteracao de auditoria',
    'created_at informado pelo cliente', 'data do servidor',
    case when (select created_at from public.audit_log where resource_id = 'PAC-RLS')
              > now() - interval '5 minutes'
         then 'data do servidor' else 'RETROAGIU -- REGRESSAO' end);

  begin
    update public.audit_log set action = 'adulterado' where resource_id = 'PAC-RLS';
    get diagnostics n = row_count;
    insert into resultado values (12, 'Adulteracao de auditoria',
      'admin altera linha da auditoria', '0 linhas', n::text || ' linhas');
  exception when others then
    insert into resultado values (12, 'Adulteracao de auditoria',
      'admin altera linha da auditoria', '0 linhas', '0 linhas');
  end;

  begin
    delete from public.audit_log where resource_id = 'PAC-RLS';
    get diagnostics n = row_count;
    insert into resultado values (13, 'Adulteracao de auditoria',
      'admin apaga linha da auditoria', '0 linhas', n::text || ' linhas');
  exception when others then
    insert into resultado values (13, 'Adulteracao de auditoria',
      'admin apaga linha da auditoria', '0 linhas', '0 linhas');
  end;

  -- ==========================================================================
  -- Ameaça: admin lendo prontuário
  --
  -- Ainda não há tabela clínica (Fase 4). O que dá para fixar agora é o
  -- predicado que as policies clínicas vão usar — se alguém "corrigir"
  -- `is_clinical_role()` para incluir admin, este teste cai.
  -- ==========================================================================
  insert into resultado values (14, 'Admin lendo prontuario',
    'is_clinical_role() para admin', 'false', public.is_clinical_role()::text);

  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', psi_a), true);
  insert into resultado values (15, 'Admin lendo prontuario',
    'is_clinical_role() para psicologa', 'true', public.is_clinical_role()::text);

  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', sec_a), true);
  insert into resultado values (16, 'Admin lendo prontuario',
    'is_clinical_role() para secretaria', 'false', public.is_clinical_role()::text);

  -- ==========================================================================
  -- Ameaça: leitura anônima
  -- ==========================================================================
  perform set_config('request.jwt.claims', '', true);
  set local role anon;

  select count(*) into n from public.clinics;
  insert into resultado values (17, 'Leitura anonima',
    'anon lista clinicas', '0', n::text);

  select count(*) into n from public.profiles;
  insert into resultado values (18, 'Leitura anonima',
    'anon lista perfis', '0', n::text);

  set local role authenticated;

  -- ==========================================================================
  -- Ameaça: perfil arquivado mantendo acesso
  -- ==========================================================================
  set local role postgres;
  update public.profiles set archived_at = now() where id = psi_a::uuid;
  set local role authenticated;

  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', psi_a), true);
  insert into resultado values (19, 'Perfil arquivado',
    'clinica visivel apos arquivamento', '0',
    (select count(*)::text from public.clinics));

  -- ==========================================================================
  -- Ameaça: convite indevido
  --
  -- `invitations` carrega e-mail de pessoa e o papel que ela terá. Não é dado
  -- para qualquer membro ler, e o convite é o caminho por onde alguém entra na
  -- clínica — forjá-lo é forjar acesso.
  -- ==========================================================================
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_a), true);

  insert into public.invitations (clinic_id, email, role, invited_by, token_hash, expires_at)
  values (clinica_a, 'novo@clinica.com', 'psychologist', admin_a::uuid,
          'hash-de-teste-1', now() + interval '7 days')
  returning id into convite;
  insert into resultado values (20, 'Convite',
    'admin cria convite', 'PERMITIDO', 'PERMITIDO');

  insert into resultado values (21, 'Convite',
    'created_at imposto pelo servidor', 'data do servidor',
    case when (select created_at from public.invitations where id = convite)
              > now() - interval '5 minutes'
         then 'data do servidor' else 'RETROAGIU -- REGRESSAO' end);

  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', sec_a), true);

  select count(*) into n from public.invitations;
  insert into resultado values (22, 'Convite',
    'secretaria le convites', '0', n::text);

  begin
    insert into public.invitations (clinic_id, email, role, invited_by, token_hash, expires_at)
    values (clinica_a, 'x@y.com', 'admin', sec_a::uuid, 'hash-de-teste-2',
            now() + interval '7 days');
    insert into resultado values (23, 'Convite',
      'secretaria cria convite', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (23, 'Convite',
      'secretaria cria convite', 'BLOQUEADO', 'BLOQUEADO');
  end;

  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_b), true);

  select count(*) into n from public.invitations;
  insert into resultado values (24, 'Convite cross-tenant',
    'admin B le convites da clinica A', '0', n::text);

  update public.invitations set revoked_at = now() where id = convite;
  get diagnostics n = row_count;
  insert into resultado values (25, 'Convite cross-tenant',
    'admin B revoga convite da clinica A', '0 linhas', n::text || ' linhas');

  -- `invited_by = auth.uid()` no WITH CHECK: nem admin atribui convite a outro.
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated"}', admin_a), true);
  begin
    insert into public.invitations (clinic_id, email, role, invited_by, token_hash, expires_at)
    values (clinica_a, 'outro@clinica.com', 'secretary', admin_b::uuid,
            'hash-de-teste-3', now() + interval '7 days');
    insert into resultado values (26, 'Convite',
      'admin forja invited_by', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (26, 'Convite',
      'admin forja invited_by', 'BLOQUEADO', 'BLOQUEADO');
  end;

  -- O índice parcial usa `lower(email)`: variar a caixa não escapa dele.
  begin
    insert into public.invitations (clinic_id, email, role, invited_by, token_hash, expires_at)
    values (clinica_a, 'NOVO@clinica.com', 'secretary', admin_a::uuid,
            'hash-de-teste-4', now() + interval '7 days');
    insert into resultado values (27, 'Convite',
      'duplicar convite pendente (case-insensitive)', 'BLOQUEADO', 'PASSOU -- REGRESSAO');
  exception when others then
    insert into resultado values (27, 'Convite',
      'duplicar convite pendente (case-insensitive)', 'BLOQUEADO', 'BLOQUEADO');
  end;

  perform set_config('request.jwt.claims', '', true);
  set local role anon;
  select count(*) into n from public.invitations;
  insert into resultado values (28, 'Leitura anonima',
    'anon lista convites', '0', n::text);
  set local role authenticated;
end $$;

select
  ordem,
  ameaca,
  cenario,
  esperado,
  obtido,
  case when obtido = esperado then 'ok' else 'FALHOU' end as veredito
from resultado
order by ordem;

do $$
declare
  falhas int;
  detalhe text;
begin
  select count(*), string_agg(format('#%s %s', ordem, cenario), '; ' order by ordem)
    into falhas, detalhe
  from resultado where obtido is distinct from esperado;

  if falhas > 0 then
    raise exception 'RLS: % cenario(s) falharam -> %', falhas, detalhe;
  end if;

  raise notice 'RLS: todos os cenarios passaram.';
end $$;

rollback;
