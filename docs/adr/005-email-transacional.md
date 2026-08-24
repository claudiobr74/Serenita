# ADR 005 — E-mail transacional

**Status:** Aceito
**Data:** 2026-08-24

## Contexto

A Fase 3 produziu dois fluxos que dependem de e-mail: o convite de membro, que
é nosso, e a recuperação de senha e magic link, que são do Supabase Auth. Sem
envio, o convite nascia inutilizável — o token em claro só existia no retorno da
Server Action e era descartado.

O produto é clínico e brasileiro. E-mail trafega e repousa em servidor de
terceiro, fora do nosso controle e fora da RLS, o que muda o que pode ser dito
por esse canal.

## Decisão

### 1. Dois caminhos distintos, e isso precisa ficar explícito

| Mensagem                                               | Sai por                   |
| ------------------------------------------------------ | ------------------------- |
| Magic link, recuperação de senha, confirmação de conta | **SMTP do Supabase Auth** |
| Convite de membro, e o que vier depois                 | **Nossa porta de e-mail** |

Não unificamos. Os e-mails do Auth são disparados pelo Supabase em resposta a
chamadas de `supabase.auth.*`, e interceptá-los exigiria webhook e reimplementação
do que já funciona.

**Consequência operacional:** configurar `EMAIL_PROVIDER` não faz o magic link
funcionar. Para produção é preciso, além disso, configurar SMTP próprio em
Authentication → Emails → SMTP Settings — o SMTP padrão do Supabase tem limite
baixo e não serve para produção.

### 2. Porta `EmailProvider`, na forma do ADR 003

```ts
// server/providers/email/types.ts
export interface EmailProvider {
  readonly nome: string;
  readonly entregaDeVerdade: boolean;
  enviar(mensagem: Mensagem): Promise<ResultadoEnvio>;
}
```

Adaptadores: `ConsoleEmailProvider` e `ResendEmailProvider`. O Resend usa `fetch`
direto, sem SDK — são duas chamadas e um corpo JSON, e um SDK seria dependência
com superfície maior que o problema. Trocar por SendGrid, Postmark ou SES é
escrever um arquivo do mesmo tamanho.

### 3. O padrão é `console`, e ele não entrega

Sem `EMAIL_PROVIDER`, o adaptador imprime o e-mail no servidor. A aplicação
funciona sem credencial nenhuma, e quem clona o repositório exercita o fluxo de
convite no primeiro `npm run dev`.

`entregaDeVerdade` distingue "aceito pelo adaptador" de "saiu para o mundo". É o
que faz a tela de convite continuar exibindo o link de repasse manual em
desenvolvimento, e parar de exibi-lo quando o e-mail de fato vai.

Cair para `console` em silêncio quando falta credencial seria pior do que falhar:
em produção o convite pareceria enviado e nunca chegaria. Por isso
`EMAIL_PROVIDER=resend` sem chave **lança**.

### 4. Nenhum e-mail carrega conteúdo clínico

Regra inviolável, escrita na porta. Nome de paciente, prontuário, plano
terapêutico, transcrição, anotação de sessão e resumo de IA não entram em
assunto, corpo ou anexo. O que pode ir é convite, aviso de conta e link para a
aplicação — onde a autorização de verdade acontece.

O convite carrega nome da clínica, papel, link e prazo. Nada mais.

### 5. Falha de envio não derruba a operação

Quando o e-mail falha, o convite **já está gravado**. `enviarConvite` devolve o
que aconteceu em vez de lançar, e a interface mostra o link para repasse manual
com o motivo da falha. Um convite válido não vira erro para quem convidou.

O adaptador tem timeout de 10s: sem ele, um fornecedor lento seguraria a Server
Action.

## Alternativas consideradas

**SMTP do Supabase para tudo, inclusive o convite.** Um caminho só. Rejeitado:
o Supabase Auth envia e-mail em resposta aos seus próprios fluxos, e forçar um
convite por ali exigiria criar um usuário antes do aceite — invertendo a ordem
do fluxo e deixando conta órfã se o convite não for aceito.

**SDK do fornecedor.** Rejeitado: dependência a manter para duas chamadas HTTP.

**Falhar sem `EMAIL_PROVIDER` configurado.** Rejeitado: tornaria o repositório
não executável sem credencial de terceiro, e o fluxo de convite intestável
localmente.

## Consequências

**Positivas**

- Trocar de fornecedor é um arquivo, sem tocar domínio.
- O fluxo de convite funciona localmente sem nenhuma credencial.
- A regra de "nada clínico por e-mail" tem um ponto único onde é aplicada e
  testada.

**Negativas**

- Dois caminhos de e-mail para configurar em produção, em vez de um. Mitigado
  documentando nos dois lugares (`.env.example` e aqui).
- O template é HTML inline e verboso. É o custo de e-mail que renderiza em
  cliente antigo.

## Verificação

- Teste que varre `src/` e falha se `RESEND_API_KEY` ou o host da API
  aparecerem fora de `server/providers/email/`.
- Teste que o domínio (`domain/email/`) não importa a porta de envio.
- Teste que o convite não contém vocabulário clínico, em assunto, texto e HTML.
- Teste de escape de HTML no nome da clínica, que é entrada de usuário.
- Teste que o corpo em texto puro não é HTML disfarçado.
