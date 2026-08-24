"use client";

import { CircleAlertIcon, MailIcon } from "lucide-react";
import { useActionState } from "react";

import { AlertBanner, Button, Input } from "@/components/ui";

import {
  enviarRecuperacaoDeSenha,
  type EstadoFormulario,
} from "../login/actions";

export function RecuperarForm() {
  const [estado, acao, enviando] = useActionState<
    EstadoFormulario | undefined,
    FormData
  >(enviarRecuperacaoDeSenha, undefined);

  return (
    <div className="flex flex-col gap-5">
      {estado?.erro && (
        <AlertBanner
          icon={CircleAlertIcon}
          tone="error"
          title="Não foi possível enviar"
          description={estado.erro}
        />
      )}
      {estado?.aviso && !estado.erro && (
        <AlertBanner
          icon={MailIcon}
          tone="info"
          title="Verifique seu e-mail"
          description={estado.aviso}
        />
      )}

      <form action={acao} className="flex flex-col gap-5">
        <Input
          label="E-mail profissional"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={estado?.campos?.email}
          className="bg-background-secondary"
        />
        <Button
          type="submit"
          variant="primary"
          size="cta"
          className="w-full"
          loading={enviando}
        >
          Enviar link de redefinição
        </Button>
      </form>
    </div>
  );
}
