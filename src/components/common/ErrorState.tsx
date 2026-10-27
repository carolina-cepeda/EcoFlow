import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Estado de error estándar con acción de reintento. */
export function ErrorState({
  titulo = "No se pudieron cargar los datos",
  mensaje,
  onReintentar,
}: {
  titulo?: string;
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <Alert variant="destructive" className="max-w-2xl">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{mensaje}</p>
        {onReintentar ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReintentar}
            className="bg-transparent"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
