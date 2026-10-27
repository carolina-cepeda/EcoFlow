import { Link } from "react-router-dom";
import { FolderKanban, Sun } from "lucide-react";
import { useProyectos } from "@/hooks/useProyectos";
import { useAuth } from "@/hooks/AuthContext";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/proyectos/EstadoBadge";
import type { EstadoProyecto } from "@/types/models";

export default function DashboardPage() {
  const { perfil, isAdmin } = useAuth();
  const { data, loading, error, refetch } = useProyectos();

  if (loading) return <LoadingState mensaje="Cargando panel…" />;

  if (error) {
    return <ErrorState mensaje={error.message} onReintentar={refetch} />;
  }

  const proyectos = data ?? [];
  const contar = (estado: EstadoProyecto) =>
    proyectos.filter((proyecto) => proyecto.estado === estado).length;

  const totalKw = proyectos.reduce(
    (acumulado, proyecto) => acumulado + Number(proyecto.potencia_kw),
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {perfil?.nombre ?? "usuario"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Vista global de los proyectos de la empresa."
            : "Solo se muestran los proyectos que tienes asignados."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metrica titulo="Proyectos visibles" valor={proyectos.length} />
        <Metrica titulo="Pendientes" valor={contar("pendiente")} />
        <Metrica titulo="En progreso" valor={contar("en_progreso")} />
        <Metrica titulo="Completados" valor={contar("completado")} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
            Próximos proyectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proyectos.length === 0 ? (
            <EmptyState
              titulo="Todavía no hay proyectos"
              descripcion={
                isAdmin
                  ? "Crea el primer proyecto para empezar a gestionarlo."
                  : "No tienes proyectos asignados por el momento."
              }
            />
          ) : (
            <ul className="divide-y">
              {proyectos.slice(0, 5).map((proyecto) => (
                <li
                  key={proyecto.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/proyectos/${proyecto.id}`}
                      className="font-medium hover:underline"
                    >
                      {proyecto.nombre}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {proyecto.cliente ?? "Sin cliente"} ·{" "}
                      {Number(proyecto.potencia_kw).toLocaleString("es-ES")} kW
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <EstadoBadge estado={proyecto.estado} />
                    <Sun
                      className="h-4 w-4 text-amber-500"
                      aria-hidden="true"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Potencia total planificada: {totalKw.toLocaleString("es-ES")} kW
      </p>
    </div>
  );
}

function Metrica({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{titulo}</p>
        <p className="mt-1 text-3xl font-semibold">{valor}</p>
      </CardContent>
    </Card>
  );
}
