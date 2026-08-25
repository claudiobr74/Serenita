# DEPLOY.md — Serenità

O que é preciso para a aplicação funcionar fora da máquina local.

Escopo: o necessário **hoje**, para as Fases 1–3. A checklist completa de
produção — backup, observabilidade, release — é da Fase 12.

---

## Variáveis de ambiente na Vercel

| Variável                               | Obrigatória                    | Observação                                                                                                                                                                 |
| -------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | sim                            | Vai para o bundle do cliente. Público por definição.                                                                                                                       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sim                            | Idem. Opera sempre sob RLS.                                                                                                                                                |
| `SUPABASE_SECRET_KEY`                  | **não**                        | Contorna RLS. Nenhum caminho da aplicação usa — só `scripts/provisionar-clinica.mts`, que roda na máquina de quem opera. **Não cadastre na Vercel** sem uma razão nomeada. |
| `EMAIL_PROVIDER`                       | não                            | Ausente = `console`: o convite não sai por e-mail e o link aparece na tela para repasse manual.                                                                            |
| `RESEND_API_KEY`, `EMAIL_REMETENTE`    | só com `EMAIL_PROVIDER=resend` | Ver `.env.example`.                                                                                                                                                        |

Sem `NEXT_PUBLIC_SUPABASE_*` o build passa — nenhuma rota estática importa o
cliente — mas a primeira requisição que toca o banco falha. Cadastre antes do
primeiro deploy.

---

## Supabase: a allowlist de redirect

**Esta é a que quebra sem aviso claro.**

`signInWithOtp` e `resetPasswordForEmail` recebem uma URL de callback que a
aplicação deriva do host da requisição (`src/app/(auth)/login/actions.ts`). Isso
faz o link funcionar em localhost, em preview e em domínio próprio sem uma
variável por ambiente.

Só que o Supabase **valida essa URL contra uma allowlist** e recusa o que não
estiver lá. O sintoma é confuso: o e-mail chega, o link parece certo, e o
usuário cai em outro lugar ou vê erro de link inválido.

No painel, em **Authentication → URL Configuration**:

- **Site URL** — a URL canônica da aplicação.
- **Redirect URLs** — inclua o callback de cada ambiente que precisa funcionar:

  ```
  http://localhost:3000/auth/callback
  https://<seu-projeto>.vercel.app/auth/callback
  https://<seu-projeto>-*.vercel.app/auth/callback
  ```

  O padrão com `*` cobre os deploys de preview, que têm URL diferente a cada
  push. Sem ele, magic link e recuperação de senha só funcionam em produção.

---

## Supabase: proteção contra senha vazada

Acusado pelo linter (`auth_leaked_password_protection`) e **desligado por
padrão**. Com ele ativo, o Supabase Auth recusa senhas que constem do
HaveIBeenPwned no cadastro e na troca.

No painel, em **Authentication → Sign In / Providers → Email**: ative _Prevent
use of leaked passwords_ e suba o comprimento mínimo de senha.

Docs: <https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection>

---

## Supabase: SMTP

Magic link, recuperação de senha e confirmação de conta saem pelo SMTP do
**Supabase Auth**, não pela porta de e-mail da aplicação. São dois caminhos
distintos — ver `docs/adr/005-email-transacional.md` §1.

O SMTP padrão do Supabase tem limite baixo e é destinado a desenvolvimento. Para
produção, configure SMTP próprio em **Authentication → Emails → SMTP Settings**.

---

## Primeira clínica

A aplicação não cria clínica: as policies não têm `INSERT` em `clinics`, de
propósito. Rode `scripts/provisionar-clinica.mts` a partir da sua máquina, com
`SUPABASE_SECRET_KEY` no `.env.local`. Ver `supabase/seed/README.md`.

---

## Verificação depois do deploy

```bash
curl https://<sua-url>/api/health
# esperado: {"status":"ok","database":"reachable","rlsBlocksAnonymousRead":true}
```

`rlsBlocksAnonymousRead: true` é o campo que importa: significa que a RLS
devolve zero linhas de `clinics` sem sessão, mesmo havendo clínica gravada.

Confira também que `/dev/components` responde 404 — a rota é de
desenvolvimento e tem dois guards independentes.
