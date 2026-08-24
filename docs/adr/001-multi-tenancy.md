# ADR 001 — Multi-tenancy por `clinic_id` com RLS desde a primeira migration

**Status:** Aceito
**Data:** 2026-08-24

## Contexto

O Serenità é um SaaS clínico multi-tenant. Cada clínica vê apenas os próprios dados, e dentro de uma clínica o acesso a conteúdo clínico é ainda mais restrito (ver ADR de autorização em `docs/AUTHORIZATION.md`). Vazamento cross-tenant de prontuário é o pior resultado possível do produto.

O prompt-mestre propunha `organization → memberships → users`. O Dev Handoff do Figma (`10 — DEV HANDOFF / Data Model`) especifica `clinics → profiles`, com `role` diretamente em `profiles`, e nomeia as colunas de 11 tabelas.

## Decisão

1. **Raiz de tenancy: `clinics`.** Toda tabela organizacional carrega `clinic_id` explicitamente, mesmo quando o vínculo poderia ser derivado por join (ex.: `clinical_records` chega a `clinics` via `patients`). A coluna redundante é deliberada: torna a policy de RLS uma comparação direta, sem join, o que é mais rápido e muito mais difícil de escrever errado.

2. **Um perfil pertence a exatamente uma clínica, com exatamente um papel.** `profiles.id = auth.uid()`, `profiles.clinic_id`, `profiles.role`. Sem tabela de membership.

3. **RLS habilitada na primeira migration**, junto com a criação de cada tabela — nunca depois. Uma tabela sensível não existe sem policy.

4. **Policies se ancoram em funções auxiliares, não em joins ad-hoc:**

   ```sql
   current_clinic_id()   -- clinic_id do perfil autenticado
   current_role()        -- papel do perfil autenticado
   is_clinical_role()    -- current_role() = 'psychologist'
   ```

   Declaradas `SECURITY DEFINER` com `search_path` fixo e `STABLE`, lendo de `profiles` por `auth.uid()`.

5. **Nenhuma policy aceita `clinic_id` vindo do cliente.** O valor sempre sai de `current_clinic_id()`. Em `INSERT`, o `WITH CHECK` força `clinic_id = current_clinic_id()`.

6. **A `service_role` key nunca chega ao browser.** Uso restrito a Edge Functions e route handlers server-side, e apenas onde contornar RLS é o comportamento pretendido (ex.: webhook do Google Calendar, que não tem sessão de usuário).

## Alternativas consideradas

**`organizations` + `memberships` (proposto no prompt-mestre).** Suportaria um usuário em várias clínicas com papéis diferentes. Rejeitado por ora: o Dev Handoff é a especificação concreta, o domínio real (um psicólogo, uma clínica) não pede multi-membership, e a estrutura mais simples tem menos superfície de erro num sistema onde erro de tenancy é catastrófico.

**Schema por tenant.** Isolamento mais forte, mas custo operacional alto (migrations × N clínicas) e sem suporte de primeira classe no Supabase. Desproporcional para o estágio do produto.

**Filtro só na aplicação, sem RLS.** Rejeitado sem discussão: um `where` esquecido vira vazamento de prontuário. O prompt-mestre proíbe explicitamente adiar RLS.

## Consequências

**Positivas**

- O banco é a última linha de defesa e não depende de disciplina no código de aplicação.
- Policies triviais de ler e de testar.
- Isolamento verificável por teste automatizado.

**Negativas**

- `clinic_id` redundante em tabelas-folha exige que a coluna seja preenchida corretamente na escrita. Mitigado por `WITH CHECK` em toda policy de `INSERT`, e por trigger de consistência onde o vínculo é derivável.
- Não há multi-membership. Introduzir depois exige uma tabela nova e reescrever as funções auxiliares — **mas não as policies**, que só chamam as funções. Custo de reversão contido por desenho.

## Verificação

Suíte dedicada de testes de RLS, com um caso por cenário:

- clínica A tentando ler dados da clínica B (select, update, delete, por ID conhecido)
- `secretary` tentando acessar registro clínico
- **`admin` tentando acessar registro clínico** — deve falhar
- usuário sem perfil
- usuário removido da clínica
- `INSERT` tentando forjar `clinic_id` de outra clínica
