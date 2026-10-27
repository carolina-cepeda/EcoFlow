import { useMateriales } from "@/hooks/useMateriales";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function MaterialesPage() {
  const { data, loading, error, refetch } = useMateriales();

  if (loading) return <LoadingState mensaje="Cargando materiales…" />;

  if (error) {
    return <ErrorState mensaje={error.message} onReintentar={refetch} />;
  }

  const materiales = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo de materiales y stock disponible en almacén.
        </p>
      </header>

      {materiales.length === 0 ? (
        <EmptyState
          titulo="No hay materiales registrados"
          descripcion="Da de alta materiales para poder asignarlos a los proyectos."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio unitario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiales.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.nombre}</TableCell>
                  <TableCell>{material.sku ?? "—"}</TableCell>
                  <TableCell>{material.unidad}</TableCell>
                  <TableCell>
                    <Badge
                      variant={Number(material.stock) > 0 ? "secondary" : "destructive"}
                    >
                      {Number(material.stock).toLocaleString("es-ES")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {material.precio_unitario === null
                      ? "—"
                      : `${Number(material.precio_unitario).toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}`}
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
