import { useCallback, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AppError, normalizarError } from "@/lib/errors";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import type {
  EstadoProyecto,
  Instalador,
  ProyectoConInstalador,
} from "@/types/models";
import type { ProyectoValues } from "@/lib/validations";

/** Resultado mínimo de una escritura en Supabase. */
type ResultadoSupabase = { error: PostgrestError | null };


export interface FiltrosProyectos {
  estado?: EstadoProyecto | "todos";
  busqueda?: string;
}

/**
 * Lista de proyectos visibles para el usuario actual.
 *
 * La RLS ya filtra: el admin ve todos, el instalador solo los que tiene
 * asignados. El join con `instaladores` se hace en memoria para no depender
 * de la inferencia de relaciones embebidas de PostgREST.
 */
export function useProyectos(filtros: FiltrosProyectos = {}) {
  const { estado = "todos", busqueda = "" } = filtros;
  const [mutando, setMutando] = useState(false);
  const [errorMutacion, setErrorMutacion] = useState<AppError | null>(null);

  const consulta = useSupabaseQuery<ProyectoConInstalador[]>(
    async () => {
      const { data: proyectos, error: errorProyectos } = await supabase
        .from("proyectos")
        .select("*")
        .order("created_at", { ascending: false });

      if (errorProyectos) throw normalizarError(errorProyectos);

      const { data: instaladores, error: errorInstaladores } = await supabase
        .from("instaladores")
        .select("id, nombre, email, rol");

      if (errorInstaladores) throw normalizarError(errorInstaladores);

      const porId = new Map<string, Pick<Instalador, "id" | "nombre" | "email" | "rol">>();
      for (const instalador of instaladores ?? []) {
        porId.set(instalador.id, instalador);
      }

      const normalizados: ProyectoConInstalador[] = (proyectos ?? []).map(
        (proyecto) => ({
          ...proyecto,
          instaladores: proyecto.instalador_id
            ? (porId.get(proyecto.instalador_id) ?? null)
            : null,
        }),
      );

      return normalizados;
    },
    [],
  );

  const proyectosFiltrados = (consulta.data ?? []).filter((proyecto) => {
    const coincideEstado =
      estado === "todos" || proyecto.estado === estado;
    const termino = busqueda.trim().toLowerCase();
    const coincideBusqueda =
      termino.length === 0 ||
      proyecto.nombre.toLowerCase().includes(termino) ||
      (proyecto.cliente?.toLowerCase().includes(termino) ?? false) ||
      (proyecto.ubicacion?.toLowerCase().includes(termino) ?? false) ||
      (proyecto.instaladores?.nombre.toLowerCase().includes(termino) ?? false);

    return coincideEstado && coincideBusqueda;
  });

  const ejecutar = useCallback(
    async (accion: () => PromiseLike<ResultadoSupabase>) => {
      setMutando(true);
      setErrorMutacion(null);
      try {
        const { error } = await accion();
        if (error) throw normalizarError(error);
      } catch (fallo) {
        const error = fallo instanceof AppError ? fallo : new AppError("Error inesperado.");
        setErrorMutacion(error);
        throw error;
      } finally {
        setMutando(false);
      }
    },
    [],
  );

  const crearProyecto = useCallback(
    async (valores: ProyectoValues) => {
      await ejecutar(() => supabase.from("proyectos").insert(valores));
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const actualizarProyecto = useCallback(
    async (id: string, valores: Partial<ProyectoValues>) => {
      await ejecutar(() => supabase.from("proyectos").update(valores).eq("id", id));
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const cambiarEstado = useCallback(
    async (id: string, nuevoEstado: EstadoProyecto) => {
      await ejecutar(() =>
        supabase.from("proyectos").update({ estado: nuevoEstado }).eq("id", id),
      );
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const asignarInstalador = useCallback(
    async (id: string, instaladorId: string | null) => {
      await ejecutar(() =>
        supabase.from("proyectos").update({ instalador_id: instaladorId }).eq("id", id),
      );
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const eliminarProyecto = useCallback(
    async (id: string) => {
      await ejecutar(() => supabase.from("proyectos").delete().eq("id", id));
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  return {
    data: proyectosFiltrados,
    loading: consulta.loading,
    error: consulta.error,
    refetch: consulta.refetch,
    mutando,
    errorMutacion,
    crearProyecto,
    actualizarProyecto,
    cambiarEstado,
    asignarInstalador,
    eliminarProyecto,
  };
}

export type { ProyectoConInstalador };
