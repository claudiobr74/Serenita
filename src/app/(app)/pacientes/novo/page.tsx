import { ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui";
import { canAccessClinicalContent } from "@/domain/auth/policy";
import { requireViewer } from "@/server/auth/session";

import { FormularioDePaciente } from "./formulario";

/**
 * `/pacientes/novo` — frame `novo-paciente` (6:5292).
 *
 * Os três papéis cadastram, conforme a RBAC Matrix: a secretária faz recepção,
 * o psicólogo cadastra o próprio paciente, o admin opera a clínica. O que muda
 * é a seção 2, que só aparece para quem tem acesso clínico.
 */

export const metadata: Metadata = {
  title: "Novo paciente — Serenità",
};

export default async function NovoPacientePage() {
  const viewer = await requireViewer();
  const clinico = canAccessClinicalContent(viewer.profile.role);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb (6:5366) — 14px, muted, chevron 12. */}
      <nav aria-label="Trilha" className="flex items-center gap-2 text-body">
        <Link
          href="/pacientes"
          className="rounded-sm text-text-muted hover:text-text-secondary hover:underline"
        >
          Pacientes
        </Link>
        <ChevronRightIcon size={12} aria-hidden className="text-text-muted" />
        <span className="font-semibold text-action-primary">Novo Cadastro</span>
      </nav>

      <Card variant="outlined" className="gap-8 rounded-[20px] p-8">
        <FormularioDePaciente clinico={clinico} />
      </Card>
    </div>
  );
}
