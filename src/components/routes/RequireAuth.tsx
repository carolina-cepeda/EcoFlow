import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/AuthContext";
import { FullPageLoader } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";

/** Solo deja pasar a usuarios con sesión activa y perfil válido. */
export function RequireAuth() {
  const { user, loading, perfilLoading, error } = useAuth();
  const location = useLocation();

  if (loading || (user && perfilLoading)) {
    return <FullPageLoader mensaje="Verificando sesión…" />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <ErrorState
          titulo="No se pudo validar tu acceso"
          mensaje={error.message}
        />
      </div>
    );
  }

  return <Outlet />;
}

/** Restringe una rama del router al rol admin. */
export function RequireAdmin() {
  const { isAdmin, loading, perfilLoading } = useAuth();

  if (loading || perfilLoading) {
    return <FullPageLoader mensaje="Verificando permisos…" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
