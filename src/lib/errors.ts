import type { PostgrestError } from "@supabase/supabase-js";

/** Error de negocio homogenizado para la capa de hooks. */
export class AppError extends Error {
  readonly code: string | null;

  constructor(message: string, code: string | null = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/**
 * Convierte un error de PostgREST en un mensaje entendible.
 * Las excepciones lanzadas por los triggers de negocio llegan en `message`,
 * por eso se prioriza ese texto sobre el mensaje genérico de PostgREST.
 */
export function normalizarError(error: PostgrestError | null): AppError | null {
  if (!error) return null;

  const codigo = error.code ?? null;
  const mensajeTrigger = error.message?.trim() ?? "";

  if (codigo === "42501" || codigo === "PGRST301") {
    return new AppError(
      "No tienes permisos para realizar esta operación.",
      codigo,
    );
  }

  if (codigo === "23505") {
    return new AppError("Ya existe un registro con esos datos.", codigo);
  }

  if (codigo === "23503") {
    return new AppError(
      "La operación afecta a registros relacionados y fue rechazada.",
      codigo,
    );
  }

  if (codigo === "23514") {
    return new AppError(
      "Los datos no cumplen las reglas del negocio del proyecto.",
      codigo,
    );
  }

  if (codigo === "PGRST116") {
    return new AppError("No se encontró el registro solicitado.", codigo);
  }

  return new AppError(
    mensajeTrigger || "Ocurrió un error inesperado. Intenta de nuevo.",
    codigo,
  );
}
