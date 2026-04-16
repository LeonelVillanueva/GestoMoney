-- =============================================================================
-- FIX LEGACY CONSTRAINTS FOR public.config
-- =============================================================================
-- Objetivo:
-- 1) Eliminar unicidad legacy por `key` (config_pkey/config_key_key).
-- 2) Garantizar unicidad moderna por (user_id, key).
-- 3) Mantener compatibilidad con RLS por usuario.
-- =============================================================================

BEGIN;

-- Asegurar columna user_id (si faltara en algún entorno desfasado)
ALTER TABLE public.config
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);

-- Si la PK legacy está en key, quitarla para permitir el modelo por usuario.
ALTER TABLE public.config DROP CONSTRAINT IF EXISTS config_pkey;

-- Si existe unique antiguo por key, quitarlo también.
ALTER TABLE public.config DROP CONSTRAINT IF EXISTS config_key_key;

-- Evitar índices únicos legacy sobre key (si fueron creados por índice y no constraint).
DROP INDEX IF EXISTS public.config_key_key;
DROP INDEX IF EXISTS public.config_key_idx;

-- Crear unicidad correcta por usuario + clave.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'config_user_id_key_unique'
  ) THEN
    ALTER TABLE public.config
      ADD CONSTRAINT config_user_id_key_unique UNIQUE (user_id, key);
  END IF;
END $$;

COMMIT;

