import { getServerSessionFromCookies } from '../../../../lib/authSessionUser.js'
import { decryptSensitive, verifyTotpCode } from '../../../../lib/auth2fa.js'
import { isSameOriginRequest } from '../../../../lib/authHttpOnly.js'

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
  const code = body?.code
  if (!code) {
    return sendJson(res, 400, { error: 'Código requerido' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const { data: mfaRow, error } = await serverSession.supabase
    .from('user_mfa_totp')
    .select('secret_encrypted')
    .eq('user_id', serverSession.user.id)
    .maybeSingle()

  if (error || !mfaRow?.secret_encrypted) {
    return sendJson(res, 404, { error: 'No existe configuración 2FA pendiente' })
  }

  const secret = decryptSensitive(mfaRow.secret_encrypted)
  const isValid = verifyTotpCode({ secret, code, window: 1 })
  if (!isValid) {
    return sendJson(res, 401, { error: 'Código inválido' })
  }

  const { error: updateError } = await serverSession.supabase
    .from('user_mfa_totp')
    .update({
      enabled: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', serverSession.user.id)

  if (updateError) {
    return sendJson(res, 500, { error: 'No se pudo activar 2FA' })
  }

  return sendJson(res, 200, { ok: true, enabled: true })
}
