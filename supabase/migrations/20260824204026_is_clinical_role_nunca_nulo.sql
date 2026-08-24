-- ============================================================================
-- 20260824204026 — `is_clinical_role()` nunca devolve NULL
--
-- Encontrado ao testar o arquivamento de membro: para perfil arquivado,
-- `current_profile_role()` devolve NULL (ela filtra `archived_at is null`), e
-- `NULL = 'psychologist'` é NULL — não `false`.
--
-- NÃO era falha de segurança: em RLS, expressão NULA nega a linha, então o
-- arquivado já não via nada. Mas uma função declarada `boolean` que devolve
-- NULL é armadilha para quem escrever as policies clínicas da Fase 4:
--
--     using (is_clinical_role() and ...)         -- nega, correto
--     using (not is_clinical_role())             -- NULL, nega — mas o autor
--                                                -- provavelmente esperava
--                                                -- que negasse o contrário
--     coalesce(is_clinical_role(), true)         -- desastre silencioso
--
-- Tornar o retorno total elimina a classe inteira de erro, sem mudar nenhum
-- comportamento existente.
-- ============================================================================

create or replace function public.is_clinical_role()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_profile_role() = 'psychologist', false);
$$;

comment on function public.is_clinical_role() is
  'Acesso a conteúdo clínico. Somente `psychologist`, e somente com perfil ativo. Nunca devolve NULL.';
