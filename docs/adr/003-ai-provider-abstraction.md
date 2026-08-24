# ADR 003 — Abstração de fornecedor de IA e serviços por caso de uso

**Status:** Aceito
**Data:** 2026-08-24

## Contexto

O Serenità usa IA em cinco lugares distintos: preparação de sessão, debrief pós-sessão, resumo clínico, supervisor e base de conhecimento. O Figma especifica "OpenAI GPT-4" como fornecedor.

Dois riscos: acoplar o domínio clínico a um SDK específico, e deixar a IA escrever no prontuário.

## Decisão

### 1. Interface `AIProvider`

Nenhum serviço de domínio importa o SDK de um fornecedor.

```ts
// server/providers/ai/types.ts
export interface AIProvider {
  complete(req: CompletionRequest): Promise<CompletionResult>;
  stream(req: CompletionRequest): AsyncIterable<CompletionChunk>;
}
```

Primeiro e único adapter: `OpenAIAdapter`, conforme o Figma. A interface existe para que trocar ou acrescentar fornecedor não toque em lógica clínica — não para suportar N fornecedores desde já.

### 2. Serviços por caso de uso, nunca um `askAI()`

```
SessionPreparationService
DebriefService
ClinicalSummaryService
SupervisorService
KnowledgeService
```

Cada serviço monta o próprio prompt, define o próprio schema de saída (validado com Zod) e aplica os próprios gates. Uma função universal `askAI()` tornaria impossível auditar o que foi enviado a um fornecedor externo em cada contexto — inaceitável com dado clínico.

### 3. Saída estruturada e validada

Toda resposta de IA é validada contra um schema Zod antes de tocar o domínio. Resposta que não valida é erro tratado, não dado.

### 4. Governança: IA nunca escreve no prontuário

```
AI generated  →  professional review  →  accepted / edited / rejected  →  clinical record
```

- Artefato de IA é persistido com estado de revisão explícito.
- Fica visualmente marcado como não revisado até a decisão do profissional.
- A aceitação gera entrada em `audit_log`.
- **Nada é incorporado automaticamente ao prontuário definitivo.**

### 5. Gate de consentimento server-side

Fluxos que dependem de processamento de IA verificam consentimento **no servidor**, antes de qualquer chamada externa. Botão desabilitado é UX, não controle de acesso — o serviço recusa por conta própria.

O Figma tem um diálogo dedicado a isto em `dialogs-confirmations`: _"Para que o Supervisor IA gere transcrições e resumos automáticos, é obrigatório obter o consentimento…"_

### 6. Postura clínica

O Supervisor IA apoia, sugere, organiza, resume e destaca padrões. **Não substitui decisão profissional e nunca apresenta conclusão como certeza clínica.** Toda resposta exibe nível de confiança e fontes citadas, com o indicador de confiança perceptível **sem depender de cor** (ícone + texto), por exigência de acessibilidade do Figma.

## Alternativas consideradas

**Chamar o SDK da OpenAI direto nos serviços.** Menos código. Rejeitado: acopla o domínio clínico a um fornecedor e espalha a superfície de envio de dado sensível.

**Gateway genérico de LLM (LangChain e similares).** Rejeitado: peso e lock-in desproporcionais para cinco casos de uso bem definidos, e uma camada a mais entre o código e o que efetivamente é enviado para fora.

## Consequências

**Positivas**

- Cada envio a fornecedor externo é rastreável até um serviço nomeado.
- Trocar de fornecedor não toca lógica clínica.
- A governança fica estruturalmente garantida, não dependente de disciplina.

**Negativas**

- Mais arquivos do que chamar o SDK direto.
- A interface precisa evoluir se um fornecedor futuro tiver capacidade sem equivalente (ex.: tool use nativo). Aceito: é o custo de não acoplar.

## Verificação

- Teste garantindo que nenhum módulo fora de `server/providers/ai/` importa o SDK do fornecedor.
- Teste de que artefato de IA não revisado nunca aparece como registro clínico finalizado.
- Teste de que o serviço recusa sem consentimento, **mesmo com a UI contornada**.
