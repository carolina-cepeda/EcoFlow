import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProyecto } from "@/hooks/useProyecto";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { EstadoBadge } from "@/components/proyectos/EstadoBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProyectoDetallePage() {
  const { proyectoId } = useParams<{ proyectoId: string }>();
  const { data, loading, error, refetch } = useProyecto(proyectoId);

  if (loading) return <LoadingState mensaje="Cargando proyecto…" />;

  if (error) {
    return <ErrorState mensaje={error.message} onReintentar={refetch} />;
  }

  if (!data) return <EmptyState titulo="Proyecto no encontrado" />;

  const { proyecto, asignaciones } = data;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/proyectos">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a proyectos
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {proyecto.nombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            {proyecto.cliente ?? "Sin cliente"} ·{" "}
            {proyecto.ubicacion ?? "Sin ubicación"}
          </p>
        </div>
        <EstadoBadge estado={proyecto.estado} />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato titulo="Potencia" valor={`${Number(proyecto.potencia_kw).toLocaleString("es-ES")} kW`} />
        <Dato titulo="Fecha de inicio" valor={proyecto.fecha_inicio} />
        <Dato titulo="Fin estimado" valor={proyecto.fecha_fin_estimada} />
        <Dato titulo="Instalador" valor={proyecto.instalador_id ? "Asignado" : "Sin asignar"} />
      </div>

      {proyecto.notas ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {proyecto.notas}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Materiales asignados</CardTitle>
        </CardHeader>
        <CardContent>
          {asignaciones.length === 0 ? (
            <EmptyState
              titulo="Sin materiales asignados"
              descripcion="El administrador puede asignar materiales al proyecto."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Stock actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaciones.map((asignacion) => (
                  <TableRow key={asignacion.id}>
                    <TableCell className="font-medium">
                      {asignacion.materiales?.nombre ?? "Material eliminado"}
                    </TableCell>
                    <TableCell>{asignacion.materiales?.sku ?? "—"}</TableCell>
                    <TableCell>
                      {Number(asignacion.cantidad).toLocaleString("es-ES")}{" "}
                      {asignacion.materiales?.unidad ?? ""}
                    </TableCell>
                    <TableCell>
                      {asignacion.materiales
                        ? Number(asignacion.materiales.stock).toLocaleString("es-ES")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="mt-1 text-lg font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
