-- =====================================================================
-- Vida Materna · Fix: la tabla `perfiles` ya existía en este proyecto
-- con otra estructura (sin email, sin terapeuta_id, rol por defecto
-- 'recepcionista'). Este script la alinea con lo que necesita la
-- pantalla de roles. Ejecútalo completo DESPUÉS de 001_roles.sql.
-- =====================================================================

-- 1) Agregar columnas que faltaban
alter table public.perfiles add column if not exists email text;
alter table public.perfiles add column if not exists terapeuta_id uuid references public.terapeutas(id) on delete set null;

-- 2) Rellenar el email de las cuentas que ya existían (viene de auth.users)
update public.perfiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- 3) Las cuentas NUEVAS deben quedar 'sin_asignar' por defecto, no 'recepcionista'
alter table public.perfiles alter column rol set default 'sin_asignar';

-- 4) Restringir los valores válidos de rol
alter table public.perfiles drop constraint if exists perfiles_rol_check;
alter table public.perfiles add constraint perfiles_rol_check
  check (rol in ('sin_asignar', 'administrador', 'recepcionista', 'especialista'));

-- =====================================================================
-- Revisa qué cuentas quedaron y cuáles son tuyas de verdad:
-- =====================================================================
-- select id, email, nombre_completo, rol from public.perfiles order by updated_at;

-- =====================================================================
-- PASO MANUAL: conviértete en administrador (con tu correo real)
-- =====================================================================
-- update public.perfiles set rol = 'administrador' where email = 'abrahamrendonm@gmail.com';

-- =====================================================================
-- OPCIONAL: las demás cuentas de prueba (admin, Berenice, María Elena, etc.)
-- quedarán con rol 'recepcionista' tal como estaban. Si quieres dejarlas
-- sin acceso hasta decidir su rol real, corre esto (ajusta el email que
-- SÍ quieres mantener como administrador para no incluirlo):
-- =====================================================================
-- update public.perfiles set rol = 'sin_asignar' where email <> 'abrahamrendonm@gmail.com';
