import { getServerSessionFromCookies } from '../../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../../lib/authHttpOnly.js'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }

  if (!isSameOriginRequest(req)) {
    return sendJson(res, 403, { error: 'Origen no autorizado' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const [mfaResult, trustedResult] = await Promise.all([
    serverSession.supabase
      .from('user_mfa_totp')
      .select('enabled, updated_at')
      .eq('user_id', serverSession.user.id)
      .maybeSingle(),
    serverSession.supabase
      .from('trusted_devices')
      .select('id, last_seen, expires_at')
      .eq('user_id', serverSession.user.id)
      .order('last_seen', { ascending: false })
      .limit(10)
  ])

  if (mfaResult.error || trustedResult.error) {
    return sendJson(res, 500, { error: 'No se pudo obtener el estado de 2FA' })
  }

  return sendJson(res, 200, {
    ok: true,
    enabled: Boolean(mfaResult.data?.enabled),
    updatedAt: mfaResult.data?.updated_at || null,
    trustedDevices: trustedResult.data || []
  })
}
