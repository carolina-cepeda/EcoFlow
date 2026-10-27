import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/common/ErrorState";

interface Estado {
  haFallado: boolean;
  mensaje: string;
}

/**
 * Captura errores de render de las vistas para que la app no quede en blanco.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  Estado
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { haFallado: false, mensaje: "" };
  }

  static getDerivedStateFromError(error: unknown): Estado {    return {
      haFallado: true,
      mensaje:
        error instanceof Error
          ? error.message
          : "Se produjo un error inesperado en la interfaz.",
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Error de render:", error, info.componentStack);
  }

  override render() {
    if (this.state.haFallado) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <ErrorState titulo="La vista ha fallado" mensaje={this.state.mensaje} />
        </div>
      );
    }

    return this.props.children;
  }
}
