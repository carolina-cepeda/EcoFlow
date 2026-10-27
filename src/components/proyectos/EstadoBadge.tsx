import { Badge } from "@/components/ui/badge";
import { ESTADO_LABELS, type EstadoProyecto } from "@/types/models";

const VARIANTES: Record<
  EstadoProyecto,
  "secondary" | "warning" | "success"
> = {
  pendiente: "secondary",
  en_progreso: "warning",
  completado: "success",
};

export function EstadoBadge({ estado }: { estado: EstadoProyecto }) {
  return <Badge variant={VARIANTES[estado]}>{ESTADO_LABELS[estado]}</Badge>;
}
