import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { AppError } from "@/lib/errors";
import type { Instalador } from "@/types/models";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  perfil: Instalador | null;
  /** true mientras se resuelve la sesión de Supabase. */
  loading: boolean;
  /** true mientras se resuelve el perfil (fila en `instaladores`). */
  perfilLoading: boolean;
  error: AppError | null;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error: AppError | null }>;
  signOut: () => Promise<void>;
  reloadPerfil: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Acceso tipado al contexto de autenticación. */
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return contexto;
}
