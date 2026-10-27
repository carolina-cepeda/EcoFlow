import { useCallback, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AppError, normalizarError } from "@/lib/errors";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import type { Instalador, Material } from "@/types/models";

/** Resultado mínimo de una escritura en Supabase. */
type ResultadoSupabase = { error: PostgrestError | null };

/**
 * Listado de materiales. Todos los usuarios autenticados pueden leerlos
 * (RLS: select a `authenticated`); las escrituras son exclusivas de admin.
 */
export function useMateriales() {
  const [mutando, setMutando] = useState(false);
  const [errorMutacion, setErrorMutacion] = useState<AppError | null>(null);

  const consulta = useSupabaseQuery<Material[]>(async () => {
    const { data, error } = await supabase
      .from("materiales")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw normalizarError(error);
    return data ?? [];
  }, []);

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

  const crearMaterial = useCallback(
    async (valores: Omit<Material, "id" | "created_at" | "updated_at">) => {
      await ejecutar(() => supabase.from("materiales").insert(valores));
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const actualizarMaterial = useCallback(
    async (id: string, valores: Partial<Material>) => {
      await ejecutar(() => supabase.from("materiales").update(valores).eq("id", id));
      consulta.refetch();
    },
    [ejecutar, consulta],
  );

  const eliminarMaterial = useCallback(
    async (id: string) => {
      await ejecutar(() => supabase.from("materiales").delete().eq("id", id));
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
    crearMaterial,
    actualizarMaterial,
    eliminarMaterial,
  };
}

/** Listado de instaladores. Solo el admin ve el padrón completo. */
export function useInstaladores(soloActivos = true) {
  const consulta = useSupabaseQuery<Instalador[]>(async () => {
    const { data, error } = await supabase
      .from("instaladores")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) throw normalizarError(error);

    const instaladores = data ?? [];
    return soloActivos
      ? instaladores.filter((instalador) => instalador.activo)
      : instaladores;
  }, [soloActivos]);

  return {
    data: consulta.data,
    loading: consulta.loading,
    error: consulta.error,
    refetch: consulta.refetch,
  };
}
