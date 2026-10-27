import { Suspense } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, Sun, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingState } from "@/components/common/LoadingState";
import { ROL_LABELS } from "@/types/models";

const enlacesBase = [
  { to: "/", label: "Panel", icon: LayoutDashboard, exacto: true },
  { to: "/proyectos", label: "Proyectos", icon: Sun, exacto: false },
];

export function AppLayout() {
  const { perfil, isAdmin, signOut } = useAuth();
  const navegar = useNavigate();

  const enlaces = isAdmin
    ? [...enlacesBase, { to: "/materiales", label: "Materiales", icon: Package, exacto: false }]
    : enlacesBase;

  const manejarCierre = async () => {
    await signOut();
    navegar("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Sun className="h-5 w-5 text-amber-500" aria-hidden="true" />
            EcoFlow
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.exacto}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )
                }
              >
                <enlace.icon className="h-4 w-4" aria-hidden="true" />
                {enlace.label}
              </NavLink>
            ))}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {perfil?.nombre ?? "Usuario"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {perfil?.nombre ?? "Usuario"}
                <span className="block text-xs font-normal text-muted-foreground">
                  {perfil ? ROL_LABELS[perfil.rol] : ""}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void manejarCierre();
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container py-8">
        <Suspense fallback={<LoadingState mensaje="Cargando vista…" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
