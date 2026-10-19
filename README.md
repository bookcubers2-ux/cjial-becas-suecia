# Becas Suecia · Carrera de Relaciones Internacionales UAGRM

Portal tipo foro que anuncia la convocatoria oficial del Swedish Institute (SI Scholarships for Global Professionals 2027/2028) y registra a docentes y personal administrativo de la Facultad, con subida de CV en PDF, para que la Dirección de Carrera los asesore.

- `index.html`: portal público (anuncio, beca, requisitos, calendario en hora Bolivia, 41 maestrías de referencia, formulario).
- `admin.html`: panel privado; entra una cuenta administradora del staff de InterMUN (mismo proyecto Supabase) y ve registros, abre CV y exporta CSV.
- `js/maestrias.js`: lista de maestrías. Actualizar cuando SI publique la lista 2027/2028 (13-nov-2026).
- `INSTALACION-SUPABASE.sql`: crea la tabla `suecia_interesados` y la carpeta privada `suecia-cv`. Se corre una vez en el SQL Editor.

Desarrollado con el apoyo de CJIAL.
