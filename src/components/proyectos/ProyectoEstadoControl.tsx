import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/AuthContext";
import {
  ESTADO_LABELS,
  SIGUIENTE_ESTADO,
  type EstadoProyecto,
} from "@/types/models";

/**
 * Control de cambio de estado respetando la máquina de estados:
 * el instalador solo avanza un paso; el admin puede avanzar o revertir.
 */
export function ProyectoEstadoControl({
  estado,
  onCambiar,
  disabled = false,
}: {
  estado: EstadoProyecto;
  onCambiar: (estado: EstadoProyecto) => Promise<void>;
  disabled?: boolean;
}) {
  const { isAdmin } = useAuth();
  const [enviando, setEnviando] = useState(false);

  const siguiente = SIGUIENTE_ESTADO[estado];

  const ejecutar = async (nuevo: EstadoProyecto) => {
    setEnviando(true);
    try {
      await onCambiar(nuevo);
    } finally {
      setEnviando(false);
    }
  };

  if (isAdmin) {
    return (
      <Select
        value={estado}
        onValueChange={(valor) => {
          void ejecutar(valor as EstadoProyecto);
        }}
        disabled={disabled || enviando}
      >
        <SelectTrigger
          className="h-9 w-[170px]"
          aria-label="Cambiar estado del proyecto"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ESTADO_LABELS) as EstadoProyecto[]).map((opcion) => (
            <SelectItem key={opcion} value={opcion}>
              {ESTADO_LABELS[opcion]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (!siguiente) {
    return (
      <span className="text-sm text-muted-foreground">Sin transiciones</span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled || enviando}
      onClick={() => {
        void ejecutar(siguiente);
      }}
    >
      {enviando ? "Actualizando…" : `Pasar a ${ESTADO_LABELS[siguiente]}`}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
