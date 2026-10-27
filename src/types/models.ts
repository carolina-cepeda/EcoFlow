import type {
  EstadoProyecto,
  RolUsuario,
  TableRow,
} from "@/types/database";

export type Instalador = TableRow<"instaladores">;
export type Proyecto = TableRow<"proyectos">;
export type Material = TableRow<"materiales">;
export type ProyectoMaterial = TableRow<"proyecto_materiales">;

export { type EstadoProyecto, type RolUsuario };

/** Etiquetas legibles para el enum de estado. */
export const ESTADO_LABELS: Record<EstadoProyecto, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
};

/** Siguiente estado válido según la máquina de estados. */
export const SIGUIENTE_ESTADO: Record<
  EstadoProyecto,
  EstadoProyecto | null
> = {
  pendiente: "en_progreso",
  en_progreso: "completado",
  completado: null,
};

/** Un instalador puede avanzar a estos estados desde el actual. */
export const TRANSICIONES_POR_ESTADO: Record<
  EstadoProyecto,
  readonly EstadoProyecto[]
> = {
  pendiente: ["en_progreso"],
  en_progreso: ["completado"],
  completado: [],
};

export const ROL_LABELS: Record<RolUsuario, string> = {
  admin: "Administrador",
  instalador: "Instalador",
};

/** Proyecto con la relación embebida de instalador (join manual en el hook). */
export type ProyectoConInstalador = Proyecto & {
  instaladores: Pick<Instalador, "id" | "nombre" | "email" | "rol"> | null;
};

/** Asignación de material a proyecto, con el material resuelto. */
export type AsignacionMaterial = ProyectoMaterial & {
  materiales: Material | null;
};
