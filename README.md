# EcoFlow

Gestión interna de proyectos de instalación de paneles solares.
React 18 + Vite + TypeScript estricto + Tailwind/shadcn-ui + Supabase.

## Fase entregada (Fase 1 — fundación)

- Esquema de base de datos con constraints, triggers de negocio y RLS por operación.
- Cliente Supabase tipado (solo clave `anon`).
- Capa de hooks con el contrato `{ data, loading, error, ...mutaciones }`.
- Autenticación (Supabase Auth) con contexto, guardas de rol y perfil 1:1.
- Router con `React.lazy` + `Suspense`, estados de carga y error en todas las vistas.
- Vistas: login, panel, listado de proyectos, detalle de proyecto, catálogo de
  materiales y perfil.

**Fuera de esta fase (Fase 2):** formularios de alta/edición de proyectos,
asignación de instaladores, CRUD de materiales con movimientos de stock,
asignación de materiales a proyectos y auditoría de cambios de estado.
Los hooks de la capa de datos ya exponen esas mutaciones (`crearProyecto`,
`asignarInstalador`, `crearMaterial`, `asignarMaterial`, …).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar URL y clave anon
npm run dev
```

Variables de entorno (todas públicas para el navegador, nunca secretos):

| Variable                  | Descripción                              |
| ------------------------- | ---------------------------------------- |
| `VITE_SUPABASE_URL`       | URL del proyecto Supabase                |
| `VITE_SUPABASE_ANON_KEY`  | Clave pública `anon`                    |

> `service_role` **nunca** va en el cliente. Si alguna vez hace falta una
> operación privileged, debe vivir en un Edge Function o en un backend.

## Base de datos

Las migraciones están en `supabase/migrations/`. Para aplicarlas:

```bash
supabase link --project-ref <ref>
supabase db push            # aplica la migración en el proyecto remoto
supabase db reset           # en local, reconstruye desde las migraciones
```

Después de aplicar la migración hay que **re-generar los tipos**:

```bash
npx supabase gen types typescript --project-id <ref> > src/types/database.ts
```

### Primer usuario admin

El trigger `handle_new_user` crea el perfil de `instaladores` con rol
`instalador` en cada alta en `auth.users`. Para promover al primer admin:

```sql
update public.instaladores
set rol = 'admin'
where email = 'tu@empresa.com';
```

### Modelo de datos

| Tabla               | Notas                                                          |
| ------------------- | -------------------------------------------------------------- |
| `instaladores`      | 1:1 con `auth.users` (`user_id` único). `rol`, `activo`.         |
| `proyectos`         | `potencia_kw > 0`, `fecha_fin_estimada >= fecha_inicio`, estado enum. |
| `materiales`        | `stock >= 0` (constraint + trigger de movimientos).              |
| `proyecto_materiales` | N:M con `cantidad > 0`, único por (proyecto, material).         |

### Reglas de negocio y dónde se aplican

| Regla                                              | Enforcement                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| 1. Máx. un instalador por proyecto                 | Columna única `proyectos.instalador_id` (FK).                      |
| 2. `potencia_kw > 0`, fechas coherentes            | `CHECK` constraints.                                              |
| 3. Transiciones `pendiente → en_progreso → completado` | Trigger `validar_transicion_estado` (el admin puede revertir). |
| 4. Stock nunca negativo                            | `CHECK` + trigger `aplicar_movimiento_stock`.                     |
| 5. El instalador no cambia su rol ni reasigna      | RLS + triggers `proteger_rol_instalador`, `proteger_asignacion_instalador`, `proteger_datos_proyecto`. |

## Arquitectura del frontend

```
src/
├── components/
│   ├── common/      LoadingState, ErrorState, EmptyState, ErrorBoundary
│   ├── layout/      AppLayout (nav + outlet)
│   ├── proyectos/   EstadoBadge, ProyectoEstadoControl
│   ├── routes/      RequireAuth, RequireAdmin
│   └── ui/          Componentes shadcn/ui
├── hooks/           Única capa con acceso a Supabase
│   ├── useAuth.ts / AuthContext.ts / AuthProvider.tsx
│   ├── useProyectos.ts / useProyecto.ts / useMateriales.ts
│   └── useSupabaseQuery.ts
├── lib/             supabase.ts, errors.ts, validations.ts, utils.ts
├── pages/           Vistas (lazy)
└── types/           database.ts (generado) + models.ts
```

Reglas mantenidas en el código:

- Ninguna vista habla con `supabase`; los datos se piden siempre a un hook.
- Cada hook devuelve `{ data, loading, error, refetch, ...mutaciones }`.
- Sin `any`: los tipos salen de `src/types/database.ts`.
- Validación doble: zod en el cliente + constraints/triggers/RLS en la base de datos.
- Rutas con `React.lazy` + `Suspense` y estados de carga/error propios.

## Scripts

```bash
npm run dev        # servidor de desarrollo
npm run build      # typecheck + build de producción
npm run typecheck  # solo comprobación de tipos
```
