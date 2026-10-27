import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <Compass className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <div>
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La ruta que buscas no existe o no tienes acceso a ella.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Volver al panel</Link>
      </Button>
    </div>
  );
}
