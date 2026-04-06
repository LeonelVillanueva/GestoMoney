-- =============================================================================
-- Verificación paso a paso (ejecutar en el SQL Editor de Supabase o la extensión)
-- Copia y ejecuta UN bloque cada vez; revisa el resultado antes del siguiente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASO 1 — Extensión pgcrypto (necesaria para el RPC del PIN)
-- Esperado: al menos una fila con extname = pgcrypto
-- -----------------------------------------------------------------------------
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pgcrypto')
ORDER BY extname;

-- -----------------------------------------------------------------------------
-- PASO 2 — Columnas user_id en tablas de negocio
-- Esperado: una fila por tabla listada, typ = uuid
-- -----------------------------------------------------------------------------
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
  AND table_name IN (
    'categories', 'expenses', 'supermarket_purchases',
    'cuts', 'budgets', 'config'
  )
ORDER BY table_name;

-- -----------------------------------------------------------------------------
-- PASO 3 — Sin filas huérfanas (después del backfill; antes debe dar 0 en todas)
-- Si algún COUNT > 0, ejecuta el backfill del README antes de NOT NULL / producción
-- -----------------------------------------------------------------------------
SELECT 'categories' AS tabla, COUNT(*) AS filas_sin_user_id
FROM public.categories WHERE user_id IS NULL
UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses WHERE user_id IS NULL
UNION ALL SELECT 'supermarket_purchases', COUNT(*) FROM public.supermarket_purchases WHERE user_id IS NULL
UNION ALL SELECT 'cuts', COUNT(*) FROM public.cuts WHERE user_id IS NULL
UNION ALL SELECT 'budgets', COUNT(*) FROM public.budgets WHERE user_id IS NULL
UNION ALL SELECT 'config', COUNT(*) FROM public.config WHERE user_id IS NULL;

-- -----------------------------------------------------------------------------
-- PASO 4 — RLS activado
-- Esperado: relrowsecurity = true para cada tabla
-- -----------------------------------------------------------------------------
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'categories', 'expenses', 'supermarket_purchases',
    'cuts', 'budgets', 'config'
  )
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- PASO 5 — Políticas RLS (debe haber varias filas por tabla)
-- -----------------------------------------------------------------------------
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'categories', 'expenses', 'supermarket_purchases',
    'cuts', 'budgets', 'config'
  )
ORDER BY tablename, policyname;

-- -----------------------------------------------------------------------------
-- PASO 6 — Restricción única en config (user_id, key)
-- Esperado: fila con conname = config_user_id_key_unique (o similar)
-- -----------------------------------------------------------------------------
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.config'::regclass
ORDER BY conname;

-- -----------------------------------------------------------------------------
-- PASO 7 — Índice único de budgets por usuario
-- -----------------------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'budgets'
  AND indexname LIKE '%user%';

-- -----------------------------------------------------------------------------
-- PASO 8 — Tabla y función del PIN (tras migración 20260404120001)
-- Esperado: tabla security_pin_verify_state existe; función verify_security_pin existe
-- -----------------------------------------------------------------------------
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'security_pin_verify_state';

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'verify_security_pin';

-- -----------------------------------------------------------------------------
-- PASO 9 — Permisos de la función RPC
-- Esperado: rol authenticated con EXECUTE (consulta aclitem según versión)
-- Si falla, en Dashboard: Database → Functions → verify_security_pin → permisos
-- -----------------------------------------------------------------------------
SELECT
  p.proname,
  array_to_string(p.proacl, E'\n') AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'verify_security_pin';
