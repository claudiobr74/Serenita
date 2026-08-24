import { PhasePlaceholder } from "@/components/shell/phase-placeholder";

/**
 * Tab "Prontuário" do perfil do paciente.
 *
 * A rota existe para que a navegação por tabs funcione como no frame 6:869 —
 * uma tab que não navega seria pior do que uma tab que explica o que falta.
 */
export default function Page() {
  return (
    <PhasePlaceholder
      screen="Prontuário"
      phase="Fase 4, fatia seguinte"
      figmaNode="6:1658"
    />
  );
}
