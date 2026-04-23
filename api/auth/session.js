import { createAuthServerClient } from '../../lib/authServerClient.js'
import {
  clearAuthCookies,
  getAuthTokensFromRequest,
  isSameOriginRequest,
  safeAuthUser,
  setAuthCookies
} from '../../lib/authHttpOnly.js'

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
    return sendJson(res, 403, { authenticated: false })
  }

  const { accessToken, refreshToken } = getAuthTokensFromRequest(req)
  if (!refreshToken) {
    clearAuthCookies(res)
    return sendJson(res, 401, { authenticated: false })
  }

  const supabase = createAuthServerClient()
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken || '',
    refresh_token: refreshToken
  })

  if (error || !data?.session) {
    clearAuthCookies(res)
    return sendJson(res, 401, { authenticated: false })
  }

  setAuthCookies(res, data.session)
  return sendJson(res, 200, {
    authenticated: true,
    user: safeAuthUser(data.session)
  })
}

