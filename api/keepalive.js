import { createClient } from '@supabase/supabase-js'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(payload))
}

function createAdminClient() {
  const url = process.env.SUPABASE_PROYECT_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceRoleKey) throw new Error('Faltan las credenciales de Supabase para el keepalive')
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

/** Ejecuta una transacción que inserta y borra un registro efímero en Supabase. */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' })
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    return sendJson(res, 401, { ok: false, error: 'Unauthorized' })
  }

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('run_system_keepalive')
    if (error) throw error

    return sendJson(res, 200, { ok: true, executedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Supabase keepalive failed', error)
    return sendJson(res, 500, { ok: false, error: 'No se pudo ejecutar el keepalive de Supabase' })
  }
}
