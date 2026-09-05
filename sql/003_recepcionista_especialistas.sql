-- =====================================================================
-- Vida Materna · Permitir que Recepcionista dé de alta Especialistas
-- La pantalla de Usuarios ahora deja que Recepcionista asigne el rol
-- "especialista" (y solo ese) directamente. Sin esta política, Supabase
-- bloquearía ese UPDATE por RLS (antes solo Administrador podía tocar
-- la tabla `perfiles`).
-- Ejecuta esto en el SQL Editor, después de 001 y 002.
-- =====================================================================

drop policy if exists "recepcionistas gestionan especialistas" on public.perfiles;
create policy "recepcionistas gestionan especialistas"
  on public.perfiles for update
  using (public.rol_actual() = 'recepcionista' and rol in ('sin_asignar', 'especialista'))
  with check (public.rol_actual() = 'recepcionista' and rol in ('sin_asignar', 'especialista'));

-- Con esto, Recepcionista solo puede tocar cuentas que ya estén en
-- 'sin_asignar' o 'especialista', y solo puede dejarlas en esos dos
-- valores. Nunca puede crear ni tocar cuentas de Administrador/Recepcionista.
