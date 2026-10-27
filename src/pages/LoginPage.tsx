import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sun } from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";
import { loginSchema, type LoginValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navegar = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!loading && user) {
      navegar("/", { replace: true });
    }
  }, [loading, user, navegar]);

  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const onSubmit = async (valores: LoginValues) => {
    setErrorServidor(null);
    const { ok, error } = await signIn(valores.email, valores.password);
    if (ok) {
      navegar("/", { replace: true });
      return;
    }
    setErrorServidor(error?.message ?? "No se pudo iniciar sesión.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Sun className="h-8 w-8 text-amber-500" aria-hidden="true" />
          <CardTitle className="text-2xl">EcoFlow</CardTitle>
          <CardDescription>
            Acceso interno para gestión de instalaciones solares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errorServidor ? (
              <Alert variant="destructive">
                <AlertDescription>{errorServidor}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.com"
                aria-invalid={errors.email ? "true" : "false"}
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? "true" : "false"}
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Entrando…" : "Entrar"}
            </Button>

            <Alert variant="warning" className="text-xs">
              <AlertDescription>
                El acceso lo concede un administrador. Si no tienes cuenta,
                solicítala al equipo de EcoFlow.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
