import { createAuthServerClient } from '../../../lib/authServerClient.js'
import { getServerSessionFromCookies } from '../../../lib/authSessionUser.js'
import { decryptSensitive, verifyTotpCode } from '../../../lib/auth2fa.js'
import { isSameOriginRequest } from '../../../lib/authHttpOnly.js'

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
  const code = String(body?.code || '')
  const currentPassword = String(body?.currentPassword || '')
  if (!code || !currentPassword) {
    return sendJson(res, 400, { error: 'Código y contraseña son requeridos' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const reauthClient = createAuthServerClient()
  const { data: reauthData, error: reauthError } = await reauthClient.auth.signInWithPassword({
    email: serverSession.user.email,
    password: currentPassword
  })
  if (reauthError || !reauthData?.session) {
    return sendJson(res, 401, { error: 'Contraseña incorrecta' })
  }

  const { data: mfaRow, error } = await serverSession.supabase
    .from('user_mfa_totp')
    .select('secret_encrypted, enabled')
    .eq('user_id', serverSession.user.id)
    .maybeSingle()

  if (error || !mfaRow?.enabled) {
    return sendJson(res, 404, { error: '2FA no está activo' })
  }

  const secret = decryptSensitive(mfaRow.secret_encrypted)
  const valid = verifyTotpCode({ secret, code, window: 1 })
  if (!valid) {
    return sendJson(res, 401, { error: 'Código de autenticador inválido' })
  }

  const nowIso = new Date().toISOString()
  const { error: disableError } = await serverSession.supabase
    .from('user_mfa_totp')
    .update({
      enabled: false,
      updated_at: nowIso
    })
    .eq('user_id', serverSession.user.id)

  if (disableError) {
    return sendJson(res, 500, { error: 'No se pudo desactivar 2FA' })
  }

  await serverSession.supabase.from('trusted_devices').delete().eq('user_id', serverSession.user.id)
  await serverSession.supabase
    .from('auth_challenges')
    .delete()
    .eq('user_id', serverSession.user.id)
    .eq('consumed_at', null)

  return sendJson(res, 200, { ok: true, enabled: false })
}
