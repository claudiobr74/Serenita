# Seed e provisionamento

Dados de desenvolvimento. **Apenas dados fictícios.**

Nunca criar dados clínicos reais, nem em ambiente de desenvolvimento.

Os seeds chegam junto com as tabelas que populam, conforme as fases de
`IMPLEMENTATION_PLAN.md`.

---

## Provisionar a primeira clínica

`scripts/provisionar-clinica.mts` cria a clínica e seu primeiro administrador.

### Por que é um script, e não uma tela

As policies de RLS **não têm `INSERT` em `clinics`**, e `profiles_insert_admin`
exige que quem insere já seja admin da clínica. Isso é proposital — fecha a
porta para alguém criar tenant pela API pública — mas produz um ovo-e-galinha:
não há como ser admin de uma clínica que ainda não existe.

`/onboarding` (frame 6:5213) é rota **Auth + Admin**: ele _completa_ a clínica,
não a cria. Ver `docs/DESIGN_DECISIONS.md` #26.

O script usa a chave `service_role`, que contorna RLS. É operado por pessoa,
fora da aplicação, e a chave nunca chega ao browser.

### Uso

```bash
cp .env.example .env.local   # e preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY

npm run provisionar -- \
  --clinica "Espaço Serenità" \
  --slug espaco-serenita \
  --admin-email mariana@clinica.com.br \
  --admin-nome "Dra. Mariana Costa"
```

Valide antes de escrever:

```bash
npm run provisionar -- ... --dry-run
```

### Senha

Sem `--senha`: o administrador é criado **sem senha** e entra pelo próprio
login, em "Receber link de acesso por e-mail". É o caminho preferido — senha em
linha de comando fica no histórico do shell.

Para automação, passe pela variável de ambiente:

```bash
PROVISION_SENHA='...' npm run provisionar -- ...
```

### O que o script garante

- Slug livre, no mesmo formato da constraint de `clinics.slug`
- E-mail sem perfil existente — um perfil pertence a exatamente uma clínica
- **Desfaz na ordem inversa se falhar no meio**: uma clínica sem dono não é
  acessível nem removível pela aplicação, então não pode sobrar
- Registra `clinic.provisioned` no `audit_log`

### Verificação

Depois de rodar, confirme que o admin funciona de fato:

```sql
-- como o usuário provisionado, via PostgREST ou psql com o JWT dele
select public.current_clinic_id(), public.current_profile_role(), public.is_clinical_role();
-- esperado: <uuid da clínica> | admin | false
```

`is_clinical_role()` devolvendo `false` para admin é o **comportamento
correto**: a RBAC Matrix nega acesso clínico a administradores.

---

## Semear o usuário dos testes e2e

Os testes de `e2e/shell.spec.ts` exigem sessão e são pulados sem credencial.
Para habilitá-los:

```bash
PROVISION_SENHA='uma-senha-de-teste' npm run provisionar -- \
  --clinica "Clínica de Teste" \
  --slug clinica-de-teste \
  --admin-email e2e@teste.local \
  --admin-nome "Usuária E2E"

E2E_EMAIL=e2e@teste.local E2E_SENHA='uma-senha-de-teste' npm run test:e2e
```

**Nunca aponte isto para o projeto de produção.**
