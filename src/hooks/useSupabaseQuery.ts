import { useCallback, useEffect, useRef, useState } from "react";
import { AppError } from "@/lib/errors";

export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refetch: () => void;
}

/**
 * Envoltorio mínimo para lecturas de Supabase.
 *
 * Reemplaza a un data-fetching library (no hay una en el stack) y estandariza
 * la forma `{ data, loading, error, refetch }` que consumen las vistas.
 *
 * @param fetcher promesa que resuelve con los datos ya transformados
 * @param deps  dependencias que disparan una nueva carga
 */
export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [version, setVersion] = useState(0);

  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((resultado) => {
        if (cancelled) return;
        setData(resultado);
        setError(null);
      })
      .catch((fallo: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(
          fallo instanceof AppError
            ? fallo
            : new AppError("No se pudieron cargar los datos."),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const refetch = useCallback(() => setVersion((valor) => valor + 1), []);

  return { data, loading, error, refetch };
}
