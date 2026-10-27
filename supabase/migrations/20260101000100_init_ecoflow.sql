-- =============================================================================
-- EcoFlow · Migración inicial
-- Esquema: instaladores, proyectos, materiales, proyecto_materiales
-- Incluye: constraints de negocio, triggers de integridad y RLS por operación.
-- Idempotente: puede ejecutarse más de una vez sobre el mismo schema.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Tipos enumerados
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_proyecto') then
    create type public.estado_proyecto as enum ('pendiente', 'en_progreso', 'completado');
  end if;

  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type public.rol_usuario as enum ('admin', 'instalador');
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 2. Funciones de contexto (SECURITY DEFINER para evitar recursión de RLS)
--    Devuelven NULL cuando no hay sesión autenticada.
-- -----------------------------------------------------------------------------
create or replace function public.current_rol()
returns public.rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select i.rol
  from public.instaladores i
  where i.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_rol() = 'admin'::public.rol_usuario, false);
$$;

create or replace function public.current_instalador_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select i.id
  from public.instaladores i
  where i.user_id = auth.uid()
  limit 1;
$$;

-- actua_como_rol: 'service_role' (backend/migraciones) no está sujeto a las
-- validaciones de rol de los triggers de negocio.
create or replace function public.actua_como_rol()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and coalesce(auth.jwt() ->> 'role', '') <> 'service_role';
$$;

-- -----------------------------------------------------------------------------
-- 3. Tablas
-- -----------------------------------------------------------------------------

-- 3.1 instaladores (1:1 con auth.users)
create table if not exists public.instaladores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  nombre      text not null check (length(btrim(nombre)) > 0),
  email       text,
  telefono    text,
  rol         public.rol_usuario not null default 'instalador',
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.instaladores is 'Perfil de usuario interno. 1:1 con auth.users.';

-- 3.2 proyectos
create table if not exists public.proyectos (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null check (length(btrim(nombre)) > 0),
  cliente           text,
  ubicacion         text,
  potencia_kw       numeric(10, 2) not null check (potencia_kw > 0),
  fecha_inicio      date not null,
  fecha_fin_estimada date not null,
  estado            public.estado_proyecto not null default 'pendiente',
  instalador_id     uuid references public.instaladores (id) on delete set null,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint proyectos_fechas_coherentes check (fecha_fin_estimada >= fecha_inicio)
);

comment on column public.proyectos.instalador_id is
  'Regla 1: columna única -> un proyecto tiene como máximo un instalador asignado.';

create index if not exists proyectos_instalador_id_idx on public.proyectos (instalador_id);
create index if not exists proyectos_estado_idx on public.proyectos (estado);

-- 3.3 materiales
create table if not exists public.materiales (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (length(btrim(nombre)) > 0),
  sku             text unique,
  descripcion     text,
  unidad          text not null default 'unidad',
  stock           numeric(12, 2) not null default 0 check (stock >= 0),
  precio_unitario numeric(12, 2) check (precio_unitario is null or precio_unitario >= 0),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- 3.4 proyecto_materiales (N:M con cantidad)
create table if not exists public.proyecto_materiales (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  material_id uuid not null references public.materiales (id) on delete restrict,
  cantidad    numeric(12, 2) not null check (cantidad > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint proyecto_materiales_unico unique (proyecto_id, material_id)
);

create index if not exists proyecto_materiales_proyecto_idx on public.proyecto_materiales (proyecto_id);
create index if not exists proyecto_materiales_material_idx on public.proyecto_materiales (material_id);

-- -----------------------------------------------------------------------------
-- 4. Triggers de integridad y reglas de negocio
-- -----------------------------------------------------------------------------

-- 4.1 updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_instaladores_updated_at on public.instaladores;
create trigger trg_instaladores_updated_at
  before update on public.instaladores
  for each row execute function public.set_updated_at();

drop trigger if exists trg_proyectos_updated_at on public.proyectos;
create trigger trg_proyectos_updated_at
  before update on public.proyectos
  for each row execute function public.set_updated_at();

drop trigger if exists trg_materiales_updated_at on public.materiales;
create trigger trg_materiales_updated_at
  before update on public.materiales
  for each row execute function public.set_updated_at();

drop trigger if exists trg_proyecto_materiales_updated_at on public.proyecto_materiales;
create trigger trg_proyecto_materiales_updated_at
  before update on public.proyecto_materiales
  for each row execute function public.set_updated_at();

-- 4.2 Regla 3: transiciones de estado válidas.
--     No-admin: solo pendiente -> en_progreso -> completado.
--     Admin: puede avanzar de un paso o revertir a cualquier estado anterior.
create or replace function public.validar_transicion_estado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin boolean := public.is_admin();
begin
  if not public.actua_como_rol() then
    return new;
  end if;

  if new.estado is not distinct from old.estado then
    return new;
  end if;

  if es_admin then
    if new.estado = 'pendiente'::public.estado_proyecto
       and old.estado in ('en_progreso'::public.estado_proyecto, 'completado'::public.estado_proyecto)
    then
      return new; -- revertir
    end if;
    if new.estado = 'en_progreso'::public.estado_proyecto
       and old.estado = 'pendiente'::public.estado_proyecto
    then
      return new; -- avanzar
    end if;
    if new.estado = 'completado'::public.estado_proyecto
       and old.estado = 'en_progreso'::public.estado_proyecto
    then
      return new; -- avanzar
    end if;
    raise exception using
      errcode = 'check_violation',
      message = 'Transicion de estado no permitida: % -> %. Un admin solo puede avanzar un paso o revertir.',
      detail = old.estado::text, hint = new.estado::text;
  end if;

  -- Instalador: unicamente avance secuencial.
  if old.estado = 'pendiente'::public.estado_proyecto
     and new.estado = 'en_progreso'::public.estado_proyecto
  then
    return new;
  end if;

  if old.estado = 'en_progreso'::public.estado_proyecto
     and new.estado = 'completado'::public.estado_proyecto
  then
    return new;
  end if;

  raise exception using
    errcode = 'insufficient_privilege',
    message = 'Transicion de estado no permitida: % -> %. Un instalador solo puede avanzar pendiente -> en_progreso -> completado.',
    detail = old.estado::text, hint = new.estado::text;
end;
$$;

drop trigger if exists trg_validar_transicion_estado on public.proyectos;
create trigger trg_validar_transicion_estado
  before update of estado on public.proyectos
  for each row execute function public.validar_transicion_estado();

-- 4.3 Regla 5: un instalador no puede reasignar proyectos.
create or replace function public.proteger_asignacion_instalador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.actua_como_rol() then
    return new;
  end if;

  if new.instalador_id is not distinct from old.instalador_id then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  raise exception using
    errcode = 'insufficient_privilege',
    message = 'Solo un admin puede asignar o reasignar un instalador a un proyecto.';
end;
$$;

drop trigger if exists trg_proteger_asignacion_instalador on public.proyectos;
create trigger trg_proteger_asignacion_instalador
  before update of instalador_id on public.proyectos
  for each row execute function public.proteger_asignacion_instalador();

-- 4.3.b Un instalador solo puede cambiar el estado de sus proyectos.
create or replace function public.proteger_datos_proyecto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.actua_como_rol() then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.nombre is distinct from old.nombre
     or new.cliente is distinct from old.cliente
     or new.ubicacion is distinct from old.ubicacion
     or new.potencia_kw is distinct from old.potencia_kw
     or new.fecha_inicio is distinct from old.fecha_inicio
     or new.fecha_fin_estimada is distinct from old.fecha_fin_estimada
     or new.notas is distinct from old.notas
  then
    raise exception using
      errcode = 'insufficient_privilege',
      message = 'Solo un admin puede modificar los datos del proyecto. Un instalador solo puede cambiar el estado.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_datos_proyecto on public.proyectos;
create trigger trg_proteger_datos_proyecto
  before update on public.proyectos
  for each row execute function public.proteger_datos_proyecto();

-- 4.4 Regla 5: un instalador no puede cambiar su propio rol ni su user_id.
create or replace function public.proteger_rol_instalador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.actua_como_rol() then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if new.rol is distinct from old.rol then
    raise exception using
      errcode = 'insufficient_privilege',
      message = 'No puedes cambiar tu propio rol.';
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception using
      errcode = 'insufficient_privilege',
      message = 'No puedes cambiar el usuario vinculado a tu perfil.';
  end if;

  if new.activo is distinct from old.activo then
    raise exception using
      errcode = 'insufficient_privilege',
      message = 'Solo un admin puede activar o desactivar un instalador.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_rol_instalador on public.instaladores;
create trigger trg_proteger_rol_instalador
  before update on public.instaladores
  for each row execute function public.proteger_rol_instalador();

-- 4.5 Regla 4: el stock nunca es negativo. El movimiento se hace siempre por
--     trigger, de modo que el saldo es consistente aunque se edite el cantidad.
create or replace function public.aplicar_movimiento_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta numeric(12, 2);
  material_id_ uuid;
  stock_actual numeric(12, 2);
begin
  if tg_op = 'DELETE' then
    material_id_ := old.material_id;
    delta := old.cantidad;
  elsif tg_op = 'INSERT' then
    material_id_ := new.material_id;
    delta := -new.cantidad;
  else
    material_id_ := new.material_id;
    delta := new.cantidad - old.cantidad;
  end if;

  if delta = 0 then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select m.stock into stock_actual
  from public.materiales m
  where m.id = material_id_
  for update;

  if stock_actual + delta < 0 then
    raise exception using
      errcode = 'check_violation',
      message = 'Stock insuficiente: no puede quedar negativo.',
      detail = format('Stock actual: %s, movimiento: %s', stock_actual, delta);
  end if;

  update public.materiales
  set stock = stock + delta
  where id = material_id_;

  -- Si la asignación cambia de material, se devuelve la cantidad al material
  -- de origen y se descuenta del nuevo.
  if tg_op = 'UPDATE' and new.material_id is distinct from old.material_id then
    update public.materiales
    set stock = stock + old.cantidad
    where id = old.material_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_aplicar_movimiento_stock on public.proyecto_materiales;
create trigger trg_aplicar_movimiento_stock
  after insert or update of cantidad or delete on public.proyecto_materiales
  for each row execute function public.aplicar_movimiento_stock();

-- 4.6 Alta automática de perfil al registrarse un usuario en auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.instaladores (user_id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'Usuario'), '@', 1)),
    new.email,
    'instalador'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- -----------------------------------------------------------------------------
alter table public.instaladores      enable row level security;
alter table public.proyectos        enable row level security;
alter table public.materiales        enable row level security;
alter table public.proyecto_materiales enable row level security;

-- 6.1 instaladores
drop policy if exists instaladores_select on public.instaladores;
create policy instaladores_select on public.instaladores
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());

drop policy if exists instaladores_insert on public.instaladores;
create policy instaladores_insert on public.instaladores
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists instaladores_update on public.instaladores;
create policy instaladores_update on public.instaladores
  for update to authenticated
  using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());

drop policy if exists instaladores_delete on public.instaladores;
create policy instaladores_delete on public.instaladores
  for delete to authenticated
  using (public.is_admin());

-- 6.2 proyectos
drop policy if exists proyectos_select on public.proyectos;
create policy proyectos_select on public.proyectos
  for select to authenticated
  using (public.is_admin() or instalador_id = public.current_instalador_id());

drop policy if exists proyectos_insert on public.proyectos;
create policy proyectos_insert on public.proyectos
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists proyectos_update on public.proyectos;
create policy proyectos_update on public.proyectos
  for update to authenticated
  using (public.is_admin() or instalador_id = public.current_instalador_id())
  with check (public.is_admin() or instalador_id = public.current_instalador_id());

drop policy if exists proyectos_delete on public.proyectos;
create policy proyectos_delete on public.proyectos
  for delete to authenticated
  using (public.is_admin());

-- 6.3 materiales
drop policy if exists materiales_select on public.materiales;
create policy materiales_select on public.materiales
  for select to authenticated
  using (auth.role() = 'authenticated');

drop policy if exists materiales_insert on public.materiales;
create policy materiales_insert on public.materiales
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists materiales_update on public.materiales;
create policy materiales_update on public.materiales
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists materiales_delete on public.materiales;
create policy materiales_delete on public.materiales
  for delete to authenticated
  using (public.is_admin());

-- 6.4 proyecto_materiales
drop policy if exists proyecto_materiales_select on public.proyecto_materiales;
create policy proyecto_materiales_select on public.proyecto_materiales
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.proyectos p
      where p.id = proyecto_materiales.proyecto_id
        and p.instalador_id = public.current_instalador_id()
    )
  );

drop policy if exists proyecto_materiales_insert on public.proyecto_materiales;
create policy proyecto_materiales_insert on public.proyecto_materiales
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists proyecto_materiales_update on public.proyecto_materiales;
create policy proyecto_materiales_update on public.proyecto_materiales
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists proyecto_materiales_delete on public.proyecto_materiales;
create policy proyecto_materiales_delete on public.proyecto_materiales
  for delete to authenticated
  using (public.is_admin());
