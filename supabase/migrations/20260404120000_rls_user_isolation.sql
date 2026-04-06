-- =============================================================================
-- RLS y aislamiento por usuario (Supabase / Postgres)
-- =============================================================================
-- Ejecuta en el SQL Editor de Supabase (orden: primero este archivo).
--
-- BACKFILL (filas antiguas con user_id NULL):
-- - Tras el paso 1, las filas existentes tienen user_id NULL. RLS (más abajo)
--   exige auth.uid() = user_id: esas filas no serán visibles hasta rellenar user_id.
-- - Descomenta el bloque 2, pon tu UUID de auth.users y ejecuta los UPDATE.
-- - Verifica con SELECT ... WHERE user_id IS NULL (conteo 0 en cada tabla).
-- - NOT NULL (comentarios al final del paso 3): solo después de que no quede ningún
--   NULL; si no, ALTER ... SET NOT NULL fallará.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- -----------------------------------------------------------------------------
-- 1) Columnas user_id
-- -----------------------------------------------------------------------------

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);
ALTER TABLE public.supermarket_purchases ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);
ALTER TABLE public.cuts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);
ALTER TABLE public.config ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);

-- -----------------------------------------------------------------------------
-- 2) Backfill — ejecutar ANTES de activar RLS si ya había datos, o justo tras
--    el paso 1 y antes del NOT NULL. Un solo UUID = un solo dueño histórico de datos.
-- -----------------------------------------------------------------------------
-- UPDATE public.categories SET user_id = 'YOUR_USER_UUID'::uuid WHERE user_id IS NULL;
-- UPDATE public.expenses SET user_id = 'YOUR_USER_UUID'::uuid WHERE user_id IS NULL;
-- UPDATE public.supermarket_purchases SET user_id = 'YOUR_USER_UUID'::uuid WHERE user_id IS NULL;
-- UPDATE public.cuts SET user_id = 'YOUR_USER_UUID'::uuid WHERE user_id IS NULL;
-- UPDATE public.budgets SET user_id = 'YOUR_USER_UUID'::uuid WHERE user_id IS NULL;
-- UPDATE public.config SET user_id = 'YOUR_USER_UUID'::uuid WHERE user_id IS NULL;
--
-- Verificación: SELECT COUNT(*) FROM public.expenses WHERE user_id IS NULL;  -- debe ser 0

-- -----------------------------------------------------------------------------
-- 3) Defaults para inserts nuevos
-- -----------------------------------------------------------------------------

ALTER TABLE public.categories ALTER COLUMN user_id SET DEFAULT auth.uid ();
ALTER TABLE public.expenses ALTER COLUMN user_id SET DEFAULT auth.uid ();
ALTER TABLE public.supermarket_purchases ALTER COLUMN user_id SET DEFAULT auth.uid ();
ALTER TABLE public.cuts ALTER COLUMN user_id SET DEFAULT auth.uid ();
ALTER TABLE public.budgets ALTER COLUMN user_id SET DEFAULT auth.uid ();
ALTER TABLE public.config ALTER COLUMN user_id SET DEFAULT auth.uid ();

-- NOT NULL opcional: solo si ya no hay NULL (si no, Postgres devuelve error):
-- ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.supermarket_purchases ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.cuts ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.budgets ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.config ALTER COLUMN user_id SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 4) Presupuestos únicos por usuario
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS public.budgets_user_category_month_unique;
CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_category_month_unique ON public.budgets (user_id, category, month);

-- -----------------------------------------------------------------------------
-- 5) CONFIG: único (user_id, key)
-- -----------------------------------------------------------------------------

ALTER TABLE public.config DROP CONSTRAINT IF EXISTS config_key_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'config_user_id_key_unique'
  ) THEN
    ALTER TABLE public.config ADD CONSTRAINT config_user_id_key_unique UNIQUE (user_id, key);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 6) Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supermarket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;

CREATE POLICY "categories_select_own" ON public.categories FOR SELECT USING (auth.uid () = user_id);
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT WITH CHECK (auth.uid () = user_id);
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE USING (auth.uid () = user_id);
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "expenses_select_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON public.expenses;

CREATE POLICY "expenses_select_own" ON public.expenses FOR SELECT USING (auth.uid () = user_id);
CREATE POLICY "expenses_insert_own" ON public.expenses FOR INSERT WITH CHECK (auth.uid () = user_id);
CREATE POLICY "expenses_update_own" ON public.expenses FOR UPDATE USING (auth.uid () = user_id);
CREATE POLICY "expenses_delete_own" ON public.expenses FOR DELETE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "supermarket_select_own" ON public.supermarket_purchases;
DROP POLICY IF EXISTS "supermarket_insert_own" ON public.supermarket_purchases;
DROP POLICY IF EXISTS "supermarket_update_own" ON public.supermarket_purchases;
DROP POLICY IF EXISTS "supermarket_delete_own" ON public.supermarket_purchases;

CREATE POLICY "supermarket_select_own" ON public.supermarket_purchases FOR SELECT USING (auth.uid () = user_id);
CREATE POLICY "supermarket_insert_own" ON public.supermarket_purchases FOR INSERT WITH CHECK (auth.uid () = user_id);
CREATE POLICY "supermarket_update_own" ON public.supermarket_purchases FOR UPDATE USING (auth.uid () = user_id);
CREATE POLICY "supermarket_delete_own" ON public.supermarket_purchases FOR DELETE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "cuts_select_own" ON public.cuts;
DROP POLICY IF EXISTS "cuts_insert_own" ON public.cuts;
DROP POLICY IF EXISTS "cuts_update_own" ON public.cuts;
DROP POLICY IF EXISTS "cuts_delete_own" ON public.cuts;

CREATE POLICY "cuts_select_own" ON public.cuts FOR SELECT USING (auth.uid () = user_id);
CREATE POLICY "cuts_insert_own" ON public.cuts FOR INSERT WITH CHECK (auth.uid () = user_id);
CREATE POLICY "cuts_update_own" ON public.cuts FOR UPDATE USING (auth.uid () = user_id);
CREATE POLICY "cuts_delete_own" ON public.cuts FOR DELETE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;

CREATE POLICY "budgets_select_own" ON public.budgets FOR SELECT USING (auth.uid () = user_id);
CREATE POLICY "budgets_insert_own" ON public.budgets FOR INSERT WITH CHECK (auth.uid () = user_id);
CREATE POLICY "budgets_update_own" ON public.budgets FOR UPDATE USING (auth.uid () = user_id);
CREATE POLICY "budgets_delete_own" ON public.budgets FOR DELETE USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "config_select_own" ON public.config;
DROP POLICY IF EXISTS "config_insert_own" ON public.config;
DROP POLICY IF EXISTS "config_update_own" ON public.config;
DROP POLICY IF EXISTS "config_delete_own" ON public.config;

CREATE POLICY "config_select_own" ON public.config FOR SELECT USING (auth.uid () = user_id);
CREATE POLICY "config_insert_own" ON public.config FOR INSERT WITH CHECK (auth.uid () = user_id);
CREATE POLICY "config_update_own" ON public.config FOR UPDATE USING (auth.uid () = user_id);
CREATE POLICY "config_delete_own" ON public.config FOR DELETE USING (auth.uid () = user_id);
