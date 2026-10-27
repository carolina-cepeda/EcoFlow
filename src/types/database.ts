/**
 * Tipos de la base de datos de EcoFlow.
 *
 * Regenerar con:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * El archivo se mantiene en el repo para que el typecheck funcione sin conexión.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EstadoProyecto = "pendiente" | "en_progreso" | "completado";
export type RolUsuario = "admin" | "instalador";

type InstallerRow = {
  id: string;
  user_id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

type ProyectoRow = {
  id: string;
  nombre: string;
  cliente: string | null;
  ubicacion: string | null;
  potencia_kw: number;
  fecha_inicio: string;
  fecha_fin_estimada: string;
  estado: EstadoProyecto;
  instalador_id: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

type MaterialRow = {
  id: string;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  unidad: string;
  stock: number;
  precio_unitario: number | null;
  created_at: string;
  updated_at: string;
};

type ProyectoMaterialRow = {
  id: string;
  proyecto_id: string;
  material_id: string;
  cantidad: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      instaladores: {
        Row: InstallerRow;
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          email?: string | null;
          telefono?: string | null;
          rol?: RolUsuario;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          email?: string | null;
          telefono?: string | null;
          rol?: RolUsuario;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "instaladores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      proyectos: {
        Row: ProyectoRow;
        Insert: {
          id?: string;
          nombre: string;
          cliente?: string | null;
          ubicacion?: string | null;
          potencia_kw: number;
          fecha_inicio: string;
          fecha_fin_estimada: string;
          estado?: EstadoProyecto;
          instalador_id?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          cliente?: string | null;
          ubicacion?: string | null;
          potencia_kw?: number;
          fecha_inicio?: string;
          fecha_fin_estimada?: string;
          estado?: EstadoProyecto;
          instalador_id?: string | null;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proyectos_instalador_id_fkey";
            columns: ["instalador_id"];
            isOneToOne: false;
            referencedRelation: "instaladores";
            referencedColumns: ["id"];
          },
        ];
      };
      materiales: {
        Row: MaterialRow;
        Insert: {
          id?: string;
          nombre: string;
          sku?: string | null;
          descripcion?: string | null;
          unidad?: string;
          stock?: number;
          precio_unitario?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          sku?: string | null;
          descripcion?: string | null;
          unidad?: string;
          stock?: number;
          precio_unitario?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      proyecto_materiales: {
        Row: ProyectoMaterialRow;
        Insert: {
          id?: string;
          proyecto_id: string;
          material_id: string;
          cantidad: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proyecto_id?: string;
          material_id?: string;
          cantidad?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proyecto_materiales_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materiales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proyecto_materiales_proyecto_id_fkey";
            columns: ["proyecto_id"];
            isOneToOne: false;
            referencedRelation: "proyectos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_rol: {
        Args: Record<PropertyKey, never>;
        Returns: RolUsuario;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      current_instalador_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      estado_proyecto: EstadoProyecto;
      rol_usuario: RolUsuario;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TableInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TableUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
