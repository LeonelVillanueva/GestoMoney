import { getServerSessionFromCookies } from '../../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../../lib/authHttpOnly.js'

const SECURITY_DB_KEYS = {
  securityNotifyNewDevice: 'seguridad_notificar_nuevo_dispositivo',
  securityMaskSensitiveAmounts: 'seguridad_ocultar_montos',
  securityAutoLockMinutes: 'seguridad_bloqueo_automatico_minutos'
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }

  if (!isSameOriginRequest(req)) {
    return sendJson(res, 403, { error: 'Origen no autorizado' })
  }

  const body = await readBody(req)
  const key = String(body?.key || '')
  const value = body?.value
  const dbKey = SECURITY_DB_KEYS[key]
  if (!dbKey) {
    return sendJson(res, 400, { error: 'Clave inválida' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const normalizedValue = String(value)
  const payload = {
    user_id: serverSession.user.id,
    key: dbKey,
    value: normalizedValue,
    description: 'Configuración avanzada de seguridad'
  }

  const { data: updatedRows, error: updateError } = await serverSession.supabase
    .from('config')
    .update({
      value: payload.value,
      description: payload.description
    })
    .eq('user_id', serverSession.user.id)
    .eq('key', dbKey)
    .select('key')

  if (updateError) {
    return sendJson(res, 500, { error: 'No se pudo guardar la configuración' })
  }

  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    const { error: insertError } = await serverSession.supabase
      .from('config')
      .insert(payload)

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: migratedRows, error: migrateError } = await serverSession.supabase
          .from('config')
          .update({
            user_id: serverSession.user.id,
            value: payload.value,
            description: payload.description
          })
          .eq('key', dbKey)
          .select('key')
        if (migrateError || !Array.isArray(migratedRows) || migratedRows.length === 0) {
          return sendJson(res, 500, { error: 'No se pudo guardar la configuración' })
        }
      } else {
        return sendJson(res, 500, { error: 'No se pudo guardar la configuración' })
      }
    }
  }

  return sendJson(res, 200, { ok: true })
}
