-- =====================================================================
-- Vida Materna · Disponibilidad semanal de especialistas
--
-- Invierte el flujo anterior: antes el especialista bloqueaba el
-- tiempo NO disponible; ahora define el tiempo SÍ disponible por
-- semana (ej. Lunes 9:00–14:00). El "Bloqueo" puntual se conserva
-- para excepciones (una falta, una cita personal) encima de ese
-- horario base.
--
-- Ejecuta esto en el SQL Editor, después de los scripts 001-003.
-- =====================================================================

create table if not exists public.disponibilidad_semanal (
  id uuid primary key default gen_random_uuid(),
  terapeuta_id uuid not null references public.terapeutas(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0=domingo ... 6=sábado
  hora_inicio time not null,
  hora_fin time not null,
  created_at timestamptz not null default now(),
  constraint disponibilidad_horas_validas check (hora_fin > hora_inicio)
);

alter table public.disponibilidad_semanal enable row level security;

-- Lectura: cualquier usuario autenticado (la agenda la necesita para
-- pintar y restringir horarios de todos los especialistas).
drop policy if exists "lectura disponibilidad autenticados" on public.disponibilidad_semanal;
create policy "lectura disponibilidad autenticados"
  on public.disponibilidad_semanal for select
  using (auth.role() = 'authenticated');

-- Admin y Recepcionista pueden gestionar la disponibilidad de cualquier especialista.
drop policy if exists "admin/recepcion gestionan cualquier disponibilidad" on public.disponibilidad_semanal;
create policy "admin/recepcion gestionan cualquier disponibilidad"
  on public.disponibilidad_semanal for all
  using (public.rol_actual() in ('administrador', 'recepcionista'))
  with check (public.rol_actual() in ('administrador', 'recepcionista'));

-- Función auxiliar: terapeuta_id vinculado al usuario autenticado actual.
create or replace function public.mi_terapeuta_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select terapeuta_id from public.perfiles where id = auth.uid();
$$;

-- Un especialista solo puede gestionar su propia disponibilidad.
drop policy if exists "especialista gestiona su propia disponibilidad" on public.disponibilidad_semanal;
create policy "especialista gestiona su propia disponibilidad"
  on public.disponibilidad_semanal for all
  using (public.rol_actual() = 'especialista' and terapeuta_id = public.mi_terapeuta_id())
  with check (public.rol_actual() = 'especialista' and terapeuta_id = public.mi_terapeuta_id());
