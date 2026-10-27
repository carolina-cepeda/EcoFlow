import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estado de carga estándar para las vistas. */
export function LoadingState({
  mensaje = "Cargando datos…",
  className,
}: {
  mensaje?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[160px] w-full flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{mensaje}</p>
    </div>
  );
}

/** Bloque de carga a pantalla completa (guardas de ruta). */
export function FullPageLoader({ mensaje = "Cargando…" }: { mensaje?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingState mensaje={mensaje} />
    </div>
  );
}
