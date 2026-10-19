-- =====================================================================
--  Becas SI Suecia · Carrera de Relaciones Internacionales UAGRM
--  Registro de docentes y personal administrativo interesados.
--
--  Se instala UNA sola vez en el proyecto Supabase de InterMUN:
--  supabase.com -> proyecto -> SQL Editor -> New query -> pegar todo -> Run.
--
--  No toca ninguna tabla de InterMUN. Crea:
--    1. la tabla public.suecia_interesados
--    2. la carpeta privada de archivos "suecia-cv" (solo PDF, max 5 MB)
--  Cualquiera puede ENVIAR su registro y su CV desde el sitio,
--  pero solo una cuenta de staff ADMINISTRADOR (es_admin()) puede LEER.
-- =====================================================================

create table if not exists public.suecia_interesados (
  id              uuid primary key default gen_random_uuid(),
  creado          timestamptz not null default now(),
  nombre          text not null check (char_length(nombre) between 3 and 160),
  ci              text check (char_length(ci) <= 30),
  correo          text not null check (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(correo) <= 160),
  celular         text not null check (char_length(celular) between 6 and 30),
  vinculo         text not null check (vinculo in ('Docente','Administrativo','Docente y administrativo','Autoridad')),
  unidad          text not null check (char_length(unidad) <= 160),
  grado           text not null check (char_length(grado) <= 120),
  titulo          text check (char_length(titulo) <= 200),
  anios_trabajo   text not null check (char_length(anios_trabajo) <= 40),
  ingles          text not null check (char_length(ingles) <= 80),
  areas           text[] not null default '{}',
  liderazgo       text check (char_length(liderazgo) <= 1500),
  comentario      text check (char_length(comentario) <= 1500),
  cv_ruta         text not null check (cv_ruta ~ '^[0-9a-f-]{36}\.pdf$'),
  consentimiento  boolean not null check (consentimiento)
);

alter table public.suecia_interesados enable row level security;

drop policy if exists "suecia_envio_publico" on public.suecia_interesados;
create policy "suecia_envio_publico" on public.suecia_interesados
  for insert to anon, authenticated with check (consentimiento);

drop policy if exists "suecia_lectura_admin" on public.suecia_interesados;
create policy "suecia_lectura_admin" on public.suecia_interesados
  for select to authenticated using (public.es_admin());

drop policy if exists "suecia_borrado_admin" on public.suecia_interesados;
create policy "suecia_borrado_admin" on public.suecia_interesados
  for delete to authenticated using (public.es_admin());

-- Carpeta privada para los CV (no es pública: se lee con enlace firmado)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('suecia-cv', 'suecia-cv', false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['application/pdf'];

drop policy if exists "suecia_cv_subida" on storage.objects;
create policy "suecia_cv_subida" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'suecia-cv' and name ~ '^[0-9a-f-]{36}\.pdf$');

drop policy if exists "suecia_cv_lectura_admin" on storage.objects;
create policy "suecia_cv_lectura_admin" on storage.objects
  for select to authenticated using (bucket_id = 'suecia-cv' and public.es_admin());

drop policy if exists "suecia_cv_borrado_admin" on storage.objects;
create policy "suecia_cv_borrado_admin" on storage.objects
  for delete to authenticated using (bucket_id = 'suecia-cv' and public.es_admin());

-- Listo. Comprobación: debe devolver 0 filas y ningún error.
select count(*) as registros from public.suecia_interesados;
