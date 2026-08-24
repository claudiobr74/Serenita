# ADR 002 — Google Calendar como calendário; Serenità como camada clínica

**Status:** Aceito
**Data:** 2026-08-24

## Contexto

O Serenità precisa de uma agenda clínica rica (status de confirmação, estado de preparo, vínculo com paciente e pagamento). O profissional, porém, já vive no Google Calendar — no telefone, no relógio, nos convites que troca. Uma agenda paralela criaria dois calendários divergentes, que é exatamente o problema que o produto deveria resolver.

O Figma dedica uma spec inteira ao tema (`10 — DEV HANDOFF / Google Calendar Integration`), duas telas de onboarding e uma tela de configurações.

## Decisão

**O Serenità não implementa uma agenda independente.** Ele fornece a UI clínica própria, sincronizada ao Google Calendar.

### Divisão de responsabilidade

| Serenità é fonte de verdade para         | Google Calendar é fonte de verdade para |
| ---------------------------------------- | --------------------------------------- |
| Relação com o paciente                   | Existência e horário do evento          |
| Status clínico da consulta               | Disponibilidade                         |
| Confirmação, preparo, estado da sessão   | Ciclo de vida do evento                 |
| Vínculo com pagamento e workflow clínico | Google Meet                             |

Formulação do próprio Figma: _"Serenitá é fonte de verdade para dados clínicos, Google Calendar é fonte de verdade para disponibilidade."_

### Privacidade — regra dura, sem exceção

Nenhum conteúdo clínico sai para o Google. O `summary` do evento leva **apenas as iniciais do paciente**, conforme a spec do Figma. Proibido enviar: diagnóstico, hipótese diagnóstica, evolução, notas, conteúdo de sessão, plano terapêutico ou qualquer informação clínica sensível.

Isso é aplicado em **um único ponto de serialização** (`server/providers/calendar/`), e não espalhado por chamadas. Um ponto único é auditável e testável; N pontos não são.

### Sincronização

- Bidirecional por webhook push (Google Calendar API push channel).
- Full sync na conexão; incremental por `syncToken`.
- **Idempotência** por `google_event_id` e por `extendedProperties.session_id` para lookup reverso. Retry nunca duplica evento.
- Persistido em `sessions`: `google_event_id`, `google_calendar_id`, `meet_link`, `sync_status`, `last_synced_at`.
- Estados: `synced · pending · syncing · error · conflict · disconnected`.

### Degradação

| Falha                | Comportamento (spec do Figma)                          |
| -------------------- | ------------------------------------------------------ |
| Token expirado       | Auto-refresh; se falhar, banner de reconexão na Agenda |
| Quota excedida       | Enfileirar escritas, processar via cron                |
| Webhook não entregue | Fallback para polling a cada 5 min                     |
| Offline              | Dados em cache com timestamp de última sincronização   |

A agenda **nunca fica em branco** por falha de integração.

## Alternativas consideradas

**Agenda própria com export opcional.** Mais controle, sem dependência de quota do Google. Rejeitado: contraria a spec do Figma e recria o problema dos dois calendários.

**Google Calendar como armazenamento único (sem tabela `sessions`).** Rejeitado: obrigaria a guardar estado clínico em campos do Google, violando a regra de privacidade, e tornaria a RLS impossível.

## Consequências

**Positivas**

- O profissional mantém um calendário só.
- Google Meet sai de graça, via `conferenceData`.
- Estado clínico fica no Postgres, sob RLS.

**Negativas**

- Depende da disponibilidade e da quota da API do Google. Mitigado por fila e polling.
- Reconciliação bidirecional é genuinamente complexa (edição externa, recorrência, exclusão de ocorrência). Mitigado por idempotência e por um estado `conflict` explícito, que é resolvido pelo usuário em vez de silenciosamente.
- Requer credenciais OAuth de produção antes de a Fase 5 poder ser concluída.

## Verificação

- Teste unitário garantindo que o serializador de evento **jamais** emite campo clínico — incluindo caso com notas preenchidas.
- Teste de idempotência: mesma sessão sincronizada N vezes gera um único evento.
- E2E: criar, remarcar e cancelar consulta com verificação do sync.
