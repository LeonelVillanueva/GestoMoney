-- =============================================================================
-- Reparar PIN de seguridad tras migración RLS (user_id en config)
-- Síntomas: "No hay PIN configurado", PIN "incorrecto" siempre, o no detecta PIN.
-- =============================================================================

-- 1) Ver cómo está guardado el hash (tabla config puede no tener columna `id`)
SELECT user_id, key, length(coalesce(value::text, '')) AS len_hash
FROM public.config
WHERE key = 'security_pin_hash';

-- 2) Listar usuarios (elige el UUID del correo con el que inicias sesión en la app)
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at;

-- 3) Enlazar el PIN a tu usuario
--
-- Importante en el SQL Editor de Supabase: ejecuta UN SOLO bloque a la vez.
-- No pegues comentarios mezclados con otra consulta ni el texto "UUID_Ingresado"
-- (debe ser un UUID real con guiones, p. ej. a1b2c3d4-e5f6-7890-abcd-ef1234567890).
--
-- 3a) RECOMENDADO si solo TÚ usas la cuenta del proyecto (un solo usuario en auth.users):
UPDATE public.config
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE key = 'security_pin_hash';

-- 3b) Si tienes varios usuarios, pon el UUID exacto del paso 2 (entre comillas simples):
-- UPDATE public.config
-- SET user_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid
-- WHERE key = 'security_pin_hash';

-- 5) Si prefieres quitar el PIN y crear uno nuevo en Ajustes → Seguridad (sin saber el antiguo):
-- DELETE FROM public.config WHERE key = 'security_pin_hash';
-- Luego en la app: Configura un PIN nuevo (no hace falta el anterior).
