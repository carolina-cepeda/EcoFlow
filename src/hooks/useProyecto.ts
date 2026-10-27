import { useCallback, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AppError, normalizarError } from "@/lib/errors";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import type { AsignacionMaterial, Material, Proyecto } from "@/types/models";

/** Resultado mínimo de una escritura en Supabase. */
type ResultadoSupabase = { error: PostgrestError | null };

export interface DetalleProyecto {
  proyecto: Proyecto;
  asignaciones: AsignacionMaterial[];
}

/**
 * Detalle de un proyecto con los materiales asignados.
 * El RLS de `proyecto_materiales` limita la lectura a los proyectos del
 * instalador; si no tiene acceso, la consulta devuelve 0 filas y se informa.
 */
export function useProyecto(proyectoId: string | undefined) {
  const [mutando, setMutando] = useState(false);
  const [errorMutacion, setErrorMutacion] = useState<AppError | null>(null);

  const consulta = useSupabaseQuery<DetalleProyecto | null>(async () => {
    if (!proyectoId) return null;

    const { data: proyecto, error: errorProyecto } = await supabase
      .from("proyectos")
      .select("*")
      .eq("id", proyectoId)
      .maybeSingle();

    if (errorProyecto) throw normalizarError(errorProyecto);
    if (!proyecto) {
      throw new AppError(
        "El proyecto no existe o no tienes acceso a él.",
        "PGRST116",
      );
    }

    const { data: asignaciones, error: errorAsignaciones } = await supabase
      .from("proyecto_materiales")
      .select("*")
      .eq("proyecto_id", proyectoId);

    if (errorAsignaciones) throw normalizarError(errorAsignaciones);

    const idsMateriales = (asignaciones ?? []).map((asignacion) => asignacion.material_id);

    const { data: materiales, error: errorMateriales } =
      idsMateriales.length > 0
        ? await supabase.from("materiales").select("*").in("id", idsMateriales)
        : { data: [] as Material[], error: null };

    if (errorMateriales) throw normalizarError(errorMateriales);

    const porId = new Map<string, Material>();
    for (const material of materiales ?? []) {
      porId.set(material.id, material);
    }

    return {
      proyecto,
      asignaciones: (asignaciones ?? []).map((asignacion) => ({
        ...asignacion,
        materiales: porId.get(asignacion.material_id) ?? null,
      })),
    };
  }, [proyectoId]);

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

  /** Asigna un material al proyecto. El stock se descuenta por trigger. */
  const asignarMaterial = useCallback(
    async (materialId: string, cantidad: number) => {
      if (!proyectoId) {
        throw new AppError("Proyecto no válido.");
      }
      await ejecutar(() =>
        supabase
          .from("proyecto_materiales")
          .insert({ proyecto_id: proyectoId, material_id: materialId, cantidad }),
      );
      consulta.refetch();
    },
    [ejecutar, consulta, proyectoId],
  );

  const actualizarCantidad = useCallback(
    async (asignacionId: string, cantidad: number) => {
      await ejecutar(() =>
        supabase
          .from("proyecto_materiales")
          .update({ cantidad })
          .eq("id", asignacionId),
      );
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const quitarMaterial = useCallback(
    async (asignacionId: string) => {
      await ejecutar(() =>
        supabase.from("proyecto_materiales").delete().eq("id", asignacionId),
      );
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  return {
    data: consulta.data,
    loading: consulta.loading,
    error: consulta.error,
    refetch: consulta.refetch,
    mutando,
    errorMutacion,
    asignarMaterial,
    actualizarCantidad,
    quitarMaterial,
  };
}
