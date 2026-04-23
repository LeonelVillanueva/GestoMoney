import crypto from 'node:crypto'
import { getServerSessionFromCookies } from '../../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../../lib/authHttpOnly.js'

const SECURITY_PIN_SALT_SUFFIX = '_gestor_gastos_salt_2025'

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

function hashPin(pin) {
  return crypto.createHash('sha256').update(`${pin}${SECURITY_PIN_SALT_SUFFIX}`).digest('hex')
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
  const pin = String(body?.pin || '')
  if (!/^\d{6}$/.test(pin)) {
    return sendJson(res, 400, { error: 'PIN inválido' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const payload = {
    user_id: serverSession.user.id,
    key: 'security_pin_hash',
    value: hashPin(pin),
    description: 'PIN de seguridad hasheado para eliminaciones'
  }

  const { data: updatedRows, error: updateError } = await serverSession.supabase
    .from('config')
    .update({
      value: payload.value,
      description: payload.description
    })
    .eq('user_id', serverSession.user.id)
    .eq('key', payload.key)
    .select('key')

  if (updateError) {
    return sendJson(res, 500, { error: 'Error al guardar PIN' })
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
          .eq('key', payload.key)
          .select('key')

        if (migrateError || !Array.isArray(migratedRows) || migratedRows.length === 0) {
          return sendJson(res, 500, { error: 'Error al guardar PIN' })
        }
      } else {
        return sendJson(res, 500, { error: 'Error al guardar PIN' })
      }
    }
  }

  return sendJson(res, 200, { ok: true })
}
