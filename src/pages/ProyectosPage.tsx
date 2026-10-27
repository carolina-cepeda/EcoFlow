import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useProyectos } from "@/hooks/useProyectos";
import { useAuth } from "@/hooks/AuthContext";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { EstadoBadge } from "@/components/proyectos/EstadoBadge";
import { ProyectoEstadoControl } from "@/components/proyectos/ProyectoEstadoControl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ESTADO_LABELS, type EstadoProyecto } from "@/types/models";

export default function ProyectosPage() {
  const { isAdmin } = useAuth();
  const [estado, setEstado] = useState<EstadoProyecto | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");

  const { data, loading, error, refetch, mutando, cambiarEstado } = useProyectos({
    estado,
    busqueda,
  });

  const manejarCambioEstado = async (id: string, nuevo: EstadoProyecto) => {
    try {
      await cambiarEstado(id, nuevo);
      toast.success(`Proyecto actualizado a ${ESTADO_LABELS[nuevo]}.`);
    } catch (fallo) {
      toast.error(
        fallo instanceof Error ? fallo.message : "No se pudo actualizar el estado.",
      );
    }
  };

  if (loading) return <LoadingState mensaje="Cargando proyectos…" />;

  if (error) {
    return <ErrorState mensaje={error.message} onReintentar={refetch} />;
  }

  const proyectos = data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Todos los proyectos de la cartera."
              : "Proyectos que tienes asignados."}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, cliente o instalador"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            aria-label="Buscar proyectos"
          />
        </div>

        <Select
          value={estado}
          onValueChange={(valor) => setEstado(valor as EstadoProyecto | "todos")}
        >
          <SelectTrigger className="w-[190px]" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {(Object.keys(ESTADO_LABELS) as EstadoProyecto[]).map((opcion) => (
              <SelectItem key={opcion} value={opcion}>
                {ESTADO_LABELS[opcion]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {proyectos.length === 0 ? (
        <EmptyState
          titulo="No hay proyectos que mostrar"
          descripcion="Ajusta los filtros o crea un nuevo proyecto."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Potencia</TableHead>
                <TableHead>Instalador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyectos.map((proyecto) => (
                <TableRow key={proyecto.id}>
                  <TableCell>
                    <Link
                      to={`/proyectos/${proyecto.id}`}
                      className="font-medium hover:underline"
                    >
                      {proyecto.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {proyecto.cliente ?? "Sin cliente"} ·{" "}
                      {proyecto.ubicacion ?? "Sin ubicación"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {Number(proyecto.potencia_kw).toLocaleString("es-ES")} kW
                  </TableCell>
                  <TableCell>
                    {proyecto.instaladores?.nombre ?? "Sin asignar"}
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={proyecto.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <ProyectoEstadoControl
                      estado={proyecto.estado}
                      disabled={mutando}
                      onCambiar={(nuevo) =>
                        manejarCambioEstado(proyecto.id, nuevo)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
