-- =====================================================================
-- Vida Materna · Roles y control de acceso
-- (administrador / recepcionista / especialista)
--
-- CÓMO USAR:
-- 1) Copia todo este archivo y pégalo en Supabase Dashboard
--    → SQL Editor → New query → Run.
-- 2) Regístrate en la app normalmente (si no lo has hecho ya) para que
--    se cree tu fila en `perfiles` (queda con rol 'sin_asignar').
-- 3) Al final de este archivo hay un UPDATE comentado: descoméntalo,
--    pon tu correo y ejecútalo UNA sola vez para convertirte en el
--    primer administrador. Los siguientes roles ya se asignan desde
--    la pantalla "Usuarios" dentro de la app.
-- =====================================================================

-- 1) Tabla de perfiles: un perfil por usuario autenticado, con su rol.
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre_completo text,
  rol text not null default 'sin_asignar'
    check (rol in ('sin_asignar', 'administrador', 'recepcionista', 'especialista')),
  terapeuta_id uuid references public.terapeutas(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- 2) Trigger: al registrarse un usuario nuevo, crear su perfil automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, email, nombre_completo)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Función auxiliar: rol del usuario autenticado actual.
-- security definer evita la recursión al consultarse desde las políticas RLS de la propia tabla perfiles.
create or replace function public.rol_actual()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

-- 4) Políticas de `perfiles`
drop policy if exists "usuarios ven su propio perfil" on public.perfiles;
create policy "usuarios ven su propio perfil"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "administradores ven todos los perfiles" on public.perfiles;
create policy "administradores ven todos los perfiles"
  on public.perfiles for select
  using (public.rol_actual() = 'administrador');

drop policy if exists "administradores actualizan perfiles" on public.perfiles;
create policy "administradores actualizan perfiles"
  on public.perfiles for update
  using (public.rol_actual() = 'administrador');

-- (Nadie inserta/borra perfiles desde el cliente; el trigger los crea con privilegios de sistema.)

-- 5) Políticas de `terapeutas` y `salas`:
--    lectura para cualquier usuario autenticado, escritura solo admin/recepcionista.
alter table public.terapeutas enable row level security;
alter table public.salas enable row level security;

drop policy if exists "lectura terapeutas autenticados" on public.terapeutas;
create policy "lectura terapeutas autenticados"
  on public.terapeutas for select
  using (auth.role() = 'authenticated');

drop policy if exists "insertar terapeutas admin/recepcion" on public.terapeutas;
create policy "insertar terapeutas admin/recepcion"
  on public.terapeutas for insert
  with check (public.rol_actual() in ('administrador', 'recepcionista'));

drop policy if exists "actualizar terapeutas admin/recepcion" on public.terapeutas;
create policy "actualizar terapeutas admin/recepcion"
  on public.terapeutas for update
  using (public.rol_actual() in ('administrador', 'recepcionista'));

drop policy if exists "eliminar terapeutas admin/recepcion" on public.terapeutas;
create policy "eliminar terapeutas admin/recepcion"
  on public.terapeutas for delete
  using (public.rol_actual() in ('administrador', 'recepcionista'));

drop policy if exists "lectura salas autenticados" on public.salas;
create policy "lectura salas autenticados"
  on public.salas for select
  using (auth.role() = 'authenticated');

drop policy if exists "insertar salas admin/recepcion" on public.salas;
create policy "insertar salas admin/recepcion"
  on public.salas for insert
  with check (public.rol_actual() in ('administrador', 'recepcionista'));

drop policy if exists "actualizar salas admin/recepcion" on public.salas;
create policy "actualizar salas admin/recepcion"
  on public.salas for update
  using (public.rol_actual() in ('administrador', 'recepcionista'));

drop policy if exists "eliminar salas admin/recepcion" on public.salas;
create policy "eliminar salas admin/recepcion"
  on public.salas for delete
  using (public.rol_actual() in ('administrador', 'recepcionista'));

-- =====================================================================
-- PASO MANUAL (una sola vez): conviértete en administrador.
-- Sustituye el correo por el tuyo y ejecútalo DESPUÉS de haberte
-- registrado al menos una vez en la app.
-- =====================================================================
-- update public.perfiles set rol = 'administrador' where email = 'tu_correo@ejemplo.com';
