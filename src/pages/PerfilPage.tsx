import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/AuthContext";
import { useActualizarPerfil } from "@/hooks/useAuth";
import { perfilSchema, type PerfilValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ROL_LABELS } from "@/types/models";

export default function PerfilPage() {
  const { perfil, user } = useAuth();
  const { actualizar, mutando, error } = useActualizarPerfil();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PerfilValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: "", telefono: "" },
  });

  useEffect(() => {
    if (perfil) {
      reset({
        nombre: perfil.nombre,
        telefono: perfil.telefono ?? "",
      });
    }
  }, [perfil, reset]);

  const onSubmit = async (valores: PerfilValues) => {
    try {
      await actualizar({ nombre: valores.nombre, telefono: valores.telefono });
      toast.success("Perfil actualizado.");
    } catch (fallo) {
      toast.error(
        fallo instanceof Error ? fallo.message : "No se pudo actualizar el perfil.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Tus datos de contacto. El rol y los permisos los gestiona un
          administrador.
        </p>
      </header>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {perfil ? ROL_LABELS[perfil.rol] : "—"}
            {perfil ? <Badge variant="outline">{perfil.email}</Badge> : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                aria-invalid={errors.nombre ? "true" : "false"}
                {...register("nombre")}
              />
              {errors.nombre ? (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                placeholder="Opcional"
                aria-invalid={errors.telefono ? "true" : "false"}
                {...register("telefono")}
              />
              {errors.telefono ? (
                <p className="text-sm text-destructive">
                  {errors.telefono.message}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error.message}</p>
            ) : null}

            <Button type="submit" disabled={mutando}>
              {mutando ? "Guardando…" : "Guardar cambios"}
            </Button>

            <p className="text-xs text-muted-foreground">
              Identificador interno: {user?.id}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
