-- =============================================================================
-- RPC verify_security_pin + bloqueo por intentos fallidos
-- Ejecutar DESPUÉS de 20260404120000_rls_user_isolation.sql
-- El salt debe coincidir con SECURITY_PIN_SALT_SUFFIX en useSecurityPin.js
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.security_pin_verify_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Solo la función SECURITY DEFINER (rol owner) accede; no PostgREST directo
REVOKE ALL ON public.security_pin_verify_state FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.verify_security_pin (p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user_id uuid := auth.uid ();
  v_hash text;
  v_input_hash text;
  v_locked_until timestamptz;
  v_max constant integer := 5;
  v_lock interval := interval '15 minutes';
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Sesión requerida');
  END IF;

  IF p_pin IS NULL OR length (p_pin) <> 6 OR p_pin !~ '^\d{6}$' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'PIN inválido');
  END IF;

  SELECT s.locked_until INTO v_locked_until
  FROM public.security_pin_verify_state s
  WHERE s.user_id = v_user_id;

  IF v_locked_until IS NOT NULL AND v_locked_until > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Demasiados intentos. Espera unos minutos.');
  END IF;

  IF v_locked_until IS NOT NULL AND v_locked_until <= now() THEN
    DELETE FROM public.security_pin_verify_state WHERE user_id = v_user_id;
  END IF;

  SELECT c.value INTO v_hash
  FROM public.config c
  WHERE c.user_id = v_user_id AND c.key = 'security_pin_hash';

  IF v_hash IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'No hay PIN configurado');
  END IF;

  v_input_hash := encode(
    extensions.digest(convert_to(p_pin || '_gestor_gastos_salt_2025', 'UTF8'), 'sha256'),
    'hex'
  );

  IF lower(v_input_hash) = lower(v_hash) THEN
    DELETE FROM public.security_pin_verify_state WHERE user_id = v_user_id;
    RETURN jsonb_build_object('valid', true);
  END IF;

  INSERT INTO public.security_pin_verify_state (user_id, failed_attempts, locked_until)
  VALUES (v_user_id, 1, NULL)
  ON CONFLICT (user_id) DO UPDATE
  SET
    failed_attempts = public.security_pin_verify_state.failed_attempts + 1,
    locked_until = CASE
      WHEN public.security_pin_verify_state.failed_attempts + 1 >= v_max THEN now() + v_lock
      ELSE public.security_pin_verify_state.locked_until
    END,
    updated_at = now();

  RETURN jsonb_build_object('valid', false, 'error', 'PIN incorrecto');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_security_pin (text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_security_pin (text) TO authenticated;
