import { createAuthServerClient } from '../../lib/authServerClient.js'
import { clearAuthCookies, getAuthTokensFromRequest, isSameOriginRequest } from '../../lib/authHttpOnly.js'

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

  const { refreshToken } = getAuthTokensFromRequest(req)
  if (refreshToken) {
    const supabase = createAuthServerClient()
    await supabase.auth.refreshSession({ refresh_token: refreshToken })
    await supabase.auth.signOut()
  }

  clearAuthCookies(res)
  return sendJson(res, 200, { ok: true })
}

