import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AppError } from "@/lib/errors";
import { useAuth } from "@/hooks/AuthContext";

/**
 * Estado de sesión de Supabase. Única fuente de verdad de la autenticación.
 * Es el único punto del frontend que habla con `supabase.auth`.
 */
export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error: errorSesion }) => {
        if (!mounted) return;
        if (errorSesion) {
          setError(
            new AppError("No se pudo restaurar la sesión activa.", errorSesion.message),
          );
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
      setUser(nuevaSesion?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: errorAuth } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (errorAuth) {
      const mensaje =
        errorAuth.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : "No se pudo iniciar sesión.";
      return { ok: false, error: new AppError(mensaje, errorAuth.status?.toString()) };
    }

    return { ok: true, error: null };
  }, []);

  const signOut = useCallback(async () => {
    const { error: errorAuth } = await supabase.auth.signOut();
    if (errorAuth) {
      throw new AppError("No se pudo cerrar la sesión.", errorAuth.message);
    }
  }, []);

  return { session, user, loading, error, signIn, signOut };
}

/**
 * Perfil del usuario actual (fila de `instaladores` 1:1 con `auth.users`).
 * La RLS limita la lectura a la propia fila para no-admin.
 */
export function usePerfil(userId: string | null) {
  const [perfil, setPerfil] = useState<import("@/types/models").Instalador | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) {
      setPerfil(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const cargarPerfil = async () => {
      const { data, error: errorPerfil } = await supabase
        .from("instaladores")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (errorPerfil) {
        setError(
          new AppError(
            "No se pudo cargar tu perfil de usuario.",
            errorPerfil.code,
          ),
        );
        return;
      }

      if (!data) {
        setError(
          new AppError(
            "Tu usuario no tiene perfil en EcoFlow. Contacta con un administrador.",
          ),
        );
        return;
      }

      setPerfil(data);
    };

    void cargarPerfil().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  const reloadPerfil = useCallback(() => setVersion((valor) => valor + 1), []);

  return { perfil, loading, error, reloadPerfil };
}

/**
 * Actualización del perfil propio (nombre y teléfono).
 * La RLS permite editar la propia fila; un trigger impide tocar `rol` y `user_id`.
 */
export function useActualizarPerfil() {
  const { perfil, reloadPerfil } = useAuth();
  const [mutando, setMutando] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const actualizar = useCallback(
    async (datos: { nombre: string; telefono: string | null }) => {
      if (!perfil) {
        const error = new AppError("No hay un perfil que actualizar.");
        setError(error);
        throw error;
      }

      setMutando(true);
      setError(null);

      const { error: errorUpdate } = await supabase
        .from("instaladores")
        .update(datos)
        .eq("id", perfil.id);

      setMutando(false);

      if (errorUpdate) {
        const normalizado = new AppError(
          errorUpdate.message || "No se pudo actualizar el perfil.",
          errorUpdate.code,
        );
        setError(normalizado);
        throw normalizado;
      }

      reloadPerfil();
    },
    [perfil, reloadPerfil],
  );

  return { actualizar, mutando, error };
}

/** Atajo al contexto: `const { user, perfil } = useAuth()`. */
export function useCurrentUser() {
  return useAuth();
}
