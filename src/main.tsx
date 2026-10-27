import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";

const contenedor = document.getElementById("root");

if (!contenedor) {
  throw new Error("No se encontró el elemento #root en index.html");
}

const CLAVES_REQUERIDAS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"] as const;

function renderizarFaltaDeConfiguracion(
  raiz: HTMLElement,
  faltantes: string[],
) {
  ReactDOM.createRoot(raiz).render(
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md space-y-3 rounded-lg border p-6">
        <h1 className="text-lg font-semibold text-destructive">
          Falta configuración de Supabase
        </h1>
        <p className="text-sm text-muted-foreground">
          Define estas variables en <code>.env.local</code> y reinicia el
          servidor de desarrollo:
        </p>
        <ul className="list-inside list-disc text-sm">
          {faltantes.map((clave) => (
            <li key={clave}>
              <code>{clave}</code>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Usa únicamente la clave pública <code>anon</code>. Nunca la{" "}
          <code>service_role</code>.
        </p>
      </div>
    </div>,
  );
}

const faltantes = CLAVES_REQUERIDAS.filter(
  (clave) => !import.meta.env[clave],
);

if (faltantes.length > 0) {
  renderizarFaltaDeConfiguracion(contenedor, faltantes);
} else {
  void (async () => {
    const [{ App }, { AuthProvider }, { Toaster }] = await Promise.all([
      import("@/App"),
      import("@/hooks/AuthProvider"),
      import("sonner"),
    ]);

    ReactDOM.createRoot(contenedor).render(
      <React.StrictMode>
        <AuthProvider>
          <App />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </React.StrictMode>,
    );
  })();
}
