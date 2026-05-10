-- Cookie HTTP-only de confianza: solo hash en BD. Ejecutar en SQL Editor de Supabase si aplica.

ALTER TABLE public.trusted_devices
  ADD COLUMN IF NOT EXISTS trust_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS trusted_devices_trust_token_hash_unique
  ON public.trusted_devices (trust_token_hash)
  WHERE trust_token_hash IS NOT NULL;
