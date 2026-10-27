import { z } from "zod";

/** Campos opcionales de texto: se normalizan a null cuando vienen vacíos. */
const textoOpcional = z
  .string()
  .trim()
  .max(500, "Máximo 500 caracteres")
  .optional()
  .transform((valor) => (valor ? valor : null));

export const loginSchema = z.object({
  email: z.string().trim().email("Introduce un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const perfilSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  telefono: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((valor) => (valor ? valor : null)),
});

export type PerfilValues = z.infer<typeof perfilSchema>;

export const proyectoSchema = z
  .object({
    nombre: z.string().trim().min(2, "El nombre es obligatorio").max(160),
    cliente: textoOpcional,
    ubicacion: textoOpcional,
    potencia_kw: z.coerce
      .number({ invalid_type_error: "Introduce un valor numérico" })
      .positive("La potencia debe ser mayor que 0")
      .max(10_000, "Potencia fuera de rango"),
    fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria"),
    fecha_fin_estimada: z.string().min(1, "La fecha fin estimada es obligatoria"),
    instalador_id: z
      .string()
      .uuid("Selecciona un instalador válido")
      .optional()
      .transform((valor) => (valor ? valor : null)),
    notas: textoOpcional,
  })
  .refine(
    (valores) =>
      valores.fecha_inicio.length === 0 ||
      valores.fecha_fin_estimada.length === 0 ||
      valores.fecha_fin_estimada >= valores.fecha_inicio,
    {
      message: "La fecha fin estimada no puede ser anterior a la fecha de inicio",
      path: ["fecha_fin_estimada"],
    },
  );

export type ProyectoValues = z.infer<typeof proyectoSchema>;

export const materialSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(160),
  sku: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((valor) => (valor ? valor : null)),
  descripcion: textoOpcional,
  unidad: z.string().trim().min(1, "La unidad es obligatoria").max(20),
  stock: z.coerce
    .number({ invalid_type_error: "Introduce un valor numérico" })
    .min(0, "El stock no puede ser negativo"),
  precio_unitario: z.coerce
    .number({ invalid_type_error: "Introduce un valor numérico" })
    .min(0, "El precio no puede ser negativo")
    .optional()
    .transform((valor) => (valor ?? null)),
});

export type MaterialValues = z.infer<typeof materialSchema>;

export const asignacionMaterialSchema = z.object({
  material_id: z.string().uuid("Selecciona un material válido"),
  cantidad: z.coerce
    .number({ invalid_type_error: "Introduce un valor numérico" })
    .positive("La cantidad debe ser mayor que 0")
    .max(1_000_000, "Cantidad fuera de rango"),
});

export type AsignacionMaterialValues = z.infer<typeof asignacionMaterialSchema>;
