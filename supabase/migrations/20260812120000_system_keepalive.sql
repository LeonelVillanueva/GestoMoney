-- Registro efímero para la actividad programada del proyecto.
-- La función de Vercel inserta una fila y la elimina inmediatamente.
CREATE TABLE IF NOT EXISTS public.system_keepalive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_keepalive ENABLE ROW LEVEL SECURITY;

-- No hay acceso para clientes. La service-role de la función de servidor omite RLS.
REVOKE ALL ON TABLE public.system_keepalive FROM anon, authenticated;

-- Una única llamada RPC: si ocurre un error, PostgreSQL revierte ambas
-- operaciones y nunca queda una fila técnica pendiente de eliminar.
CREATE OR REPLACE FUNCTION public.run_system_keepalive()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  keepalive_id UUID;
BEGIN
  INSERT INTO public.system_keepalive (source)
  VALUES ('vercel-cron')
  RETURNING id INTO keepalive_id;

  DELETE FROM public.system_keepalive WHERE id = keepalive_id;
END;
$$;

REVOKE ALL ON FUNCTION public.run_system_keepalive() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_system_keepalive() TO service_role;
