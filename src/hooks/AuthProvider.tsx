import { useMemo } from "react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "@/hooks/AuthContext";
import { useAuthSession, usePerfil } from "@/hooks/useAuth";

/**
 * Provider de autenticación. Solo compone hooks: no habla directamente con
 * Supabase (regla: el acceso a datos vive en /hooks).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, user, loading, error, signIn, signOut } = useAuthSession();
  const { perfil, loading: perfilLoading, error: errorPerfil, reloadPerfil } =
    usePerfil(user?.id ?? null);

  const valor = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      perfil,
      loading,
      perfilLoading,
      error: error ?? errorPerfil,
      isAdmin: perfil?.rol === "admin",
      signIn,
      signOut,
      reloadPerfil,
    }),
    [
      session,
      user,
      perfil,
      loading,
      perfilLoading,
      error,
      errorPerfil,
      signIn,
      signOut,
      reloadPerfil,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
