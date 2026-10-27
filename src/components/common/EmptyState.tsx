import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/** Estado vacío estándar para tablas y listados. */
export function EmptyState({
  titulo = "Sin datos",
  descripcion,
  accion,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{titulo}</p>
      {descripcion ? (
        <p className="max-w-md text-sm text-muted-foreground">{descripcion}</p>
      ) : null}
      {accion}
    </div>
  );
}
