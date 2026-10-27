import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAdmin, RequireAuth } from "@/components/routes/RequireAuth";
import { FullPageLoader } from "@/components/common/LoadingState";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProyectosPage = lazy(() => import("@/pages/ProyectosPage"));
const ProyectoDetallePage = lazy(() => import("@/pages/ProyectoDetallePage"));
const MaterialesPage = lazy(() => import("@/pages/MaterialesPage"));
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<FullPageLoader mensaje="Cargando EcoFlow…" />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="proyectos" element={<ProyectosPage />} />
                <Route
                  path="proyectos/:proyectoId"
                  element={<ProyectoDetallePage />}
                />
                <Route path="perfil" element={<PerfilPage />} />

                <Route element={<RequireAdmin />}>
                  <Route path="materiales" element={<MaterialesPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
