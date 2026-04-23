import { getServerSessionFromCookies } from '../../../../lib/authSessionUser.js'
import { buildOtpAuthUrl, encryptSensitive, generateTotpSecret } from '../../../../lib/auth2fa.js'
import { isSameOriginRequest } from '../../../../lib/authHttpOnly.js'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
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

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const secret = generateTotpSecret()
  const encryptedSecret = encryptSensitive(secret)
  const accountName = serverSession.user.email || `user-${serverSession.user.id}`
  const issuer = 'GestoMoney'
  const otpauthUrl = buildOtpAuthUrl({ issuer, accountName, secret })

  const { error } = await serverSession.supabase
    .from('user_mfa_totp')
    .upsert({
      user_id: serverSession.user.id,
      secret_encrypted: encryptedSecret,
      enabled: false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) {
    return sendJson(res, 500, { error: 'No se pudo iniciar la configuración 2FA' })
  }

  return sendJson(res, 200, {
    ok: true,
    secret,
    otpauthUrl
  })
}
