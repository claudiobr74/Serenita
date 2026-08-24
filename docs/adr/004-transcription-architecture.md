# ADR 004 — Arquitetura de transcrição e manuseio de áudio

**Status:** Aceito
**Data:** 2026-08-24

## Contexto

O Modo Sessão pode transcrever a sessão em tempo real para alimentar o debrief. Isso envolve o dado mais sensível do produto — a fala do paciente numa sessão de psicoterapia — sob restrições de plataforma serverless.

O Figma mostra o resultado (`loading-sync-states`: _"Analisando transcrição de áudio para extrair temas recorrentes e deveres de casa…"_) e exige consentimento prévio (`dialogs-confirmations`), mas não desenha os estados intermediários.

## Decisão

### 1. Interface `TranscriptionProvider`

```ts
export interface TranscriptionProvider {
  createSession(
    input: CreateTranscriptionSession,
  ): Promise<TranscriptionSession>;
  connect(sessionId: string): Promise<TranscriptionConnection>;
  pause(sessionId: string): Promise<void>;
  resume(sessionId: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
}
```

Nenhum componente de UI e nenhum serviço clínico conhece o fornecedor concreto.

### 2. Máquina de estados

```
idle → connecting → recording → transcribing → paused → reconnecting → processing → completed → error
```

Estados desenhados no Figma: `processing` (a tela "Analisando transcrição…") e `error`. Os demais são derivados do prompt-mestre §23 — ver `DESIGN_DECISIONS.md` #8. São renderizados com os componentes de loading e erro já definidos em `03 — PATTERNS`.

`reconnecting` é de primeira classe, não um detalhe: perder rede no meio de uma sessão é ocorrência normal, e **nada digitado pelo profissional pode se perder**.

### 3. Áudio nunca trafega por API comum

```
Client  →  upload direto/chunked com URL assinada de curta duração  →  Supabase Storage  →  processamento
```

Proibido: áudio em query string, em JSON grande, ou em base64 por route handler. Limites de payload e de duração de serverless são premissa de projeto.

### 4. Transcrição não é registro clínico

Entidades distintas, ciclos de vida distintos, políticas de retenção distintas.

A transcrição é insumo para o debrief. O registro clínico é escrito pelo profissional. Uma nunca vira a outra automaticamente — a transcrição entra no fluxo de revisão do ADR 003 como qualquer outro artefato de IA.

### 5. Consentimento antes de qualquer captura

Verificado **server-side** antes de criar a sessão de transcrição. Sem consentimento válido e não revogado, o provider não é sequer instanciado.

### 6. Retenção e exposição

- Áudio e transcrição bruta ficam em bucket com acesso restrito; nunca públicos.
- Acesso por URL assinada de curta duração, emitida só após checagem de autorização.
- **Nunca** aparecem em log, analytics ou error tracking (`ARCHITECTURE.md` §18).
- Política de retenção configurável por clínica, com exclusão respeitando a trilha de auditoria.

## Alternativas consideradas

**Streaming de áudio por WebSocket através do backend do Serenità.** Daria controle total do fluxo. Rejeitado: coloca o Serenità no caminho de cada byte de áudio, é caro em serverless e aumenta a superfície de exposição do dado mais sensível do produto sem benefício correspondente.

**Transcrição só no cliente (Web Speech API).** Sem custo de fornecedor e o áudio não sai do dispositivo. Rejeitado: qualidade e suporte de navegador insuficientes para uso clínico em português, e sem persistência confiável.

## Consequências

**Positivas**

- Áudio não passa por função serverless.
- Trocar de fornecedor de transcrição não toca a UI do Modo Sessão.
- Separação estrutural entre transcrição e prontuário — não é convenção, é modelagem.

**Negativas**

- Upload direto exige política de Storage e emissão de URL assinada cuidadosas; URL assinada vazada é um risco real e está na lista de ameaças de §75 do prompt-mestre. Mitigado por expiração curta e autorização antes da emissão.
- A máquina de estados tem mais estados do que o Figma desenhou, então parte da UI de transcrição não é verificável contra frames até que existam.

## Verificação

- Teste unitário da máquina de estados, incluindo `reconnecting` e recuperação.
- Teste de que nenhum caminho de código envia áudio por route handler.
- Teste de que a transcrição não pode ser promovida a registro clínico sem revisão.
- E2E: preparar → iniciar → estado de transcrição → encerrar → debrief → finalizar registro.
