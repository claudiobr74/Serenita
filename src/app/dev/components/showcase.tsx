"use client";

import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  LockIcon,
  PencilIcon,
  TrashIcon,
  TriangleAlertIcon,
  UsersIcon,
  WifiOffIcon,
} from "lucide-react";
import { useState } from "react";

import {
  AIProcessing,
  AlertBanner,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Select,
  Sheet,
  SkeletonList,
  Switch,
  Table,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabPanel,
  Tag,
  Textarea,
  Toast,
  Tooltip,
  TranscriptionProcessing,
  SyncProcessing,
} from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Showcase interativo do design system.
 *
 * Objetivo (§10 do prompt-mestre): comparar implementação e Figma lado a lado.
 * Cada seção nomeia o node do Figma de onde a spec veio, para que a comparação
 * seja verificável e não apenas visual.
 */

const BUTTON_VARIANTS = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "danger",
] as const;
const BUTTON_SIZES = ["sm", "md", "lg", "cta"] as const;

export function Showcase() {
  return (
    <div className="flex flex-col gap-10">
      <ButtonsSection />
      <FormsSection />
      <StatusSection />
      <ContainersSection />
      <TableSection />
      <TabsSection />
      <OverlaysSection />
      <StatesSection />
      <ProcessingSection />
    </div>
  );
}

function Section({
  title,
  figmaNode,
  children,
}: {
  title: string;
  figmaNode: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border-default bg-background-primary p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-h2 font-semibold text-text-primary">
          {title}
        </h2>
        <code className="font-mono text-caption text-text-secondary">
          {figmaNode}
        </code>
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-overline font-medium tracking-wide text-text-secondary uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ButtonsSection() {
  return (
    <Section title="Button" figmaNode="12:147 · 36 variants">
      {BUTTON_VARIANTS.map((variant) => (
        <Row key={variant} label={variant}>
          {BUTTON_SIZES.map((size) => (
            <Button key={size} variant={variant} size={size}>
              Button {size}
            </Button>
          ))}
          <Button variant={variant} size="md" disabled>
            Disabled
          </Button>
          <Button variant={variant} size="md" loading />
        </Row>
      ))}

      <Row label="IconButton — 6:112">
        <IconButton icon={BellIcon} label="Notificações" />
        <IconButton icon={PencilIcon} label="Editar" variant="ghost" />
        <IconButton icon={TrashIcon} label="Excluir" size="sm" />
        <Tooltip content="Com tooltip no hover e no foco">
          <IconButton icon={CalendarIcon} label="Agenda" />
        </Tooltip>
      </Row>
    </Section>
  );
}

function FormsSection() {
  const [checked, setChecked] = useState(true);
  const [enabled, setEnabled] = useState(true);

  return (
    <Section title="Formulários" figmaNode="12:168 · 03 — PATTERNS">
      <div className="grid gap-5 tablet:grid-cols-2 desktop:grid-cols-4">
        <Input label="Nome completo" placeholder="Maria Silva" />
        <Input
          label="E-mail"
          placeholder="maria@exemplo.com"
          defaultValue="maria@exemplo"
          error="E-mail inválido."
        />
        <Input label="Telefone" placeholder="(11) 90000-0000" disabled />
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          required
          hint="Exibido mascarado após salvar."
        />
      </div>

      <div className="grid gap-5 tablet:grid-cols-2">
        <Select
          label="Modalidade"
          placeholder="Selecione..."
          defaultValue=""
          options={[
            { value: "presencial", label: "Presencial" },
            { value: "online", label: "Online" },
          ]}
        />
        <Textarea
          label="Observações"
          placeholder="Anotações administrativas..."
          hint="Não é registro clínico."
        />
      </div>

      <div className="grid gap-2 tablet:grid-cols-2">
        <Checkbox
          label="Enviar lembrete por SMS"
          hint="24h antes da sessão."
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <Switch
          label="Sincronizar com Google Calendar"
          hint="Somente dados operacionais."
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
      </div>
    </Section>
  );
}

function StatusSection() {
  return (
    <Section title="Badge, Tag e Avatar" figmaNode="12:179 · 12:249 · 12:186">
      <Row label="Badge">
        <Badge variant="success">Confirmado</Badge>
        <Badge variant="warning">Pendente</Badge>
        <Badge variant="error">Cancelado</Badge>
        <Badge variant="info">Sincronizado</Badge>
        <Badge variant="neutral">Rascunho</Badge>
      </Row>
      <Row label="Tag">
        <Tag>Padrão</Tag>
        <Tag variant="clinical">Clínico</Tag>
        <Tag variant="financial">Financeiro</Tag>
        <Tag variant="calendar">Agenda</Tag>
      </Row>
      <Row label="Avatar">
        <Avatar name="Mariana Costa" size="sm" />
        <Avatar name="Mariana Costa" size="md" />
        <Avatar name="Mariana Costa" size="lg" />
      </Row>
    </Section>
  );
}

function ContainersSection() {
  return (
    <Section title="Card" figmaNode="12:196 · 3 variants">
      <div className="grid gap-4 tablet:grid-cols-3">
        {(["default", "elevated", "outlined"] as const).map((variant) => (
          <Card key={variant} variant={variant}>
            <CardTitle>Card {variant}</CardTitle>
            <CardBody>
              Corpo do card com texto de apoio. `default` e `outlined` são
              idênticos no arquivo — ver DESIGN_DECISIONS #5.
            </CardBody>
          </Card>
        ))}
      </div>
    </Section>
  );
}

const ROWS = [
  { name: "Maria Silva", code: "PAC-018", status: "Ativo" },
  { name: "Lucas Mendes", code: "PAC-022", status: "Ativo" },
  { name: "Ana Beatriz Costa", code: "PAC-031", status: "Inativo" },
] as const;

function TableSection() {
  const [selected, setSelected] = useState<string | null>("PAC-022");

  return (
    <Section title="Table" figmaNode="12:219 · 3 states">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Paciente</TableHeaderCell>
            <TableHeaderCell>Identificador</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </tr>
        </TableHead>
        <tbody>
          {ROWS.map((row) => (
            <TableRow
              key={row.code}
              interactive
              selected={selected === row.code}
              onClick={() => setSelected(row.code)}
            >
              <TableCell primary>{row.name}</TableCell>
              <TableCell>
                <span className="font-mono">{row.code}</span>
              </TableCell>
              <TableCell>
                <Badge variant={row.status === "Ativo" ? "success" : "neutral"}>
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </Section>
  );
}

const TAB_ITEMS = [
  { id: "overview", label: "Visão geral" },
  { id: "records", label: "Prontuário" },
  { id: "plan", label: "Plano terapêutico" },
] as const;

function TabsSection() {
  const [tab, setTab] = useState<string>("overview");

  return (
    <Section title="Tabs" figmaNode="6:783 · perfil-paciente">
      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />
      {TAB_ITEMS.map((item) => (
        <TabPanel key={item.id} id={item.id} active={tab === item.id}>
          <p className="pt-4 text-body text-text-secondary">
            Conteúdo de <strong>{item.label}</strong>. Setas navegam entre as
            abas.
          </p>
        </TabPanel>
      ))}
    </Section>
  );
}

function OverlaysSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <Section title="Modal e Sheet" figmaNode="12:250 · interaction-states">
      <Row label="Overlays">
        <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>
        <Button variant="outline" onClick={() => setSheetOpen(true)}>
          Abrir Sheet
        </Button>
      </Row>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Cancelar consulta"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Confirmar
            </Button>
          </>
        }
      >
        Deseja cancelar a consulta de Lucas Mendes em 24/08/2026 às 10:30? Esta
        ação notificará o paciente.
      </Modal>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Detalhes da sessão"
        footer={<Button onClick={() => setSheetOpen(false)}>Fechar</Button>}
      >
        <p className="text-body text-text-secondary">
          Sobe do rodapé com o fundo desfocando de 0 a 16px em 400ms spring,
          conforme `interaction-states`. Sob `prefers-reduced-motion` vira fade
          de 200ms.
        </p>
      </Sheet>
    </Section>
  );
}

function StatesSection() {
  return (
    <Section title="Estados" figmaNode="6:5957 · 6:6162 · 6:6071">
      <div className="grid gap-4 desktop:grid-cols-2">
        <EmptyState
          icon={UsersIcon}
          title="Você ainda não possui pacientes"
          description="Cadastre seus primeiros pacientes para gerenciar prontuários, evoluções e agendamentos estruturados."
          action={<Button size="cta">Adicionar primeiro paciente</Button>}
        />
        <EmptyState
          icon={CheckIcon}
          tone="positive"
          title="Tudo em dia!"
          description="Você não possui pendências ou evoluções atrasadas neste momento."
        />
      </div>

      <ErrorState
        icon={WifiOffIcon}
        title="Falha de conexão com transcritor"
        description="Não foi possível conectar ao serviço seguro de transcrição de áudio. Verifique sua conexão e tente novamente."
        actions={
          <>
            <Button size="cta">Tentar Novamente</Button>
            <Button size="cta" variant="outline">
              Trabalhar Offline
            </Button>
          </>
        }
      />

      <AlertBanner
        icon={LockIcon}
        title="Funcionalidades de IA Desabilitadas"
        description="As anotações e resumos automáticos do Supervisor IA estão pendentes de autorização legal do paciente."
        action={<Button size="cta">Enviar Consentimento</Button>}
      />

      <Row label="Toast — 6:6212">
        <div className="flex w-full max-w-100 flex-col gap-4">
          <Toast
            type="success"
            title="Sucesso"
            message="Registro clínico finalizado e arquivado."
            onDismiss={() => {}}
          />
          <Toast
            type="error"
            title="Erro de Gravação"
            message="Falha ao salvar. Tentando novamente..."
            onDismiss={() => {}}
          />
          <Toast
            type="warning"
            title="Sincronização pendente"
            message="12 eventos aguardando envio."
            onDismiss={() => {}}
          />
          <Toast
            type="info"
            title="Lembrete de Pendências"
            message="Você possui 3 registros clínicos pendentes."
            onDismiss={() => {}}
          />
        </div>
      </Row>
    </Section>
  );
}

function ProcessingSection() {
  return (
    <Section title="Carregamento e processamento" figmaNode="6:6071">
      <div
        className={cn(
          "rounded-2xl border border-border-default bg-background-primary p-6",
        )}
      >
        <p className="pb-4 font-display text-h3 font-bold text-text-primary">
          Carregando Diretório...
        </p>
        <SkeletonList rows={4} />
      </div>

      <div className="grid gap-4 desktop:grid-cols-3">
        <TranscriptionProcessing detail="04:12 • Processamento em tempo real criptografado" />
        <SyncProcessing
          title="Sincronizando com Google Calendar"
          detail="Atualizando 12 novos eventos da agenda..."
        />
        <AIProcessing
          description="Analisando transcrição de áudio para extrair temas recorrentes e deveres de casa..."
          progressLabel="84% COMPLETO"
        />
      </div>

      <Row label="AlertBanner — tons">
        <div className="flex w-full flex-col gap-3">
          <AlertBanner
            icon={TriangleAlertIcon}
            tone="error"
            title="Erro de Sincronização Google Calendar"
            description="Houve uma falha de autenticação ao sincronizar a agenda profissional."
          />
          <AlertBanner
            icon={CalendarIcon}
            tone="info"
            title="Agenda em modo offline"
            description="Exibindo dados em cache. Última sincronização há 12 minutos."
          />
        </div>
      </Row>
    </Section>
  );
}
