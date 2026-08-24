import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Avatar, initialsOf } from "./avatar";
import { Badge } from "./badge";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { IconButton } from "./icon-button";
import { Input } from "./input";
import { Tabs } from "./tabs";
import { Toast } from "./toast";

import { BellIcon } from "lucide-react";

/**
 * Testes dos primitivos.
 *
 * Foco no que quebra silenciosamente: contrato de acessibilidade e semântica.
 * Fidelidade visual é verificada por comparação com o Figma em
 * `/dev/components`, não aqui — asserção sobre classes de Tailwind quebraria a
 * cada refatoração sem detectar regressão real.
 */

describe("Button", () => {
  it("é um button e não submete formulário por acidente", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("em loading troca o rótulo, desabilita e anuncia aria-busy", () => {
    render(<Button loading>Salvar</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    // O Figma especifica "Aguarde..." em `interaction-states`.
    expect(button).toHaveTextContent("Aguarde...");
    expect(button).not.toHaveTextContent("Salvar");
  });

  it("não dispara clique enquanto carrega", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Salvar
      </Button>,
    );
    screen.getByRole("button").click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Input", () => {
  it("liga label e campo", () => {
    render(<Input label="CPF" />);
    expect(screen.getByLabelText(/CPF/)).toBeInTheDocument();
  });

  it("anuncia o erro e marca o campo como inválido", () => {
    render(<Input label="CPF" error="CPF inválido." />);
    const input = screen.getByLabelText(/CPF/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("CPF inválido.");
    expect(input).toHaveAccessibleDescription("CPF inválido.");
  });

  it("sucesso é silencioso — sem alerta quando não há erro", () => {
    render(<Input label="CPF" hint="Somente números." />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("Checkbox", () => {
  it("é um checkbox real, acessível pelo rótulo", () => {
    render(<Checkbox label="Enviar lembrete" defaultChecked />);
    expect(
      screen.getByRole("checkbox", { name: /Enviar lembrete/ }),
    ).toBeChecked();
  });
});

describe("IconButton", () => {
  it("exige rótulo acessível", () => {
    render(<IconButton icon={BellIcon} label="Notificações" />);
    expect(
      screen.getByRole("button", { name: "Notificações" }),
    ).toBeInTheDocument();
  });
});

describe("Toast", () => {
  it("usa role=alert em erro e role=status nos demais", () => {
    const { unmount } = render(<Toast type="error" title="Falha" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Falha");
    unmount();

    render(<Toast type="success" title="Salvo" />);
    expect(screen.getByRole("status")).toHaveTextContent("Salvo");
  });
});

describe("Badge", () => {
  it("comunica o estado por texto, não só por cor", () => {
    render(<Badge variant="success">Confirmado</Badge>);
    expect(screen.getByText("Confirmado")).toBeInTheDocument();
  });
});

describe("Avatar", () => {
  it("deriva iniciais de nome composto", () => {
    expect(initialsOf("Mariana Costa")).toBe("MC");
    expect(initialsOf("Ana Beatriz Costa Silva")).toBe("AS");
    expect(initialsOf("Madonna")).toBe("M");
    expect(initialsOf("   ")).toBe("");
  });

  it("é decorativo — o nome já aparece ao lado nas telas", () => {
    const { container } = render(<Avatar name="Mariana Costa" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Tabs", () => {
  const items = [
    { id: "a", label: "Visão geral" },
    { id: "b", label: "Prontuário" },
  ] as const;

  it("marca a aba ativa e tira as demais da ordem de Tab", () => {
    render(<Tabs items={items} value="a" onChange={() => {}} />);
    const [first, second] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");
  });
});
