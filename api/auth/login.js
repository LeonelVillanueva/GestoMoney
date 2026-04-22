import { createAuthServerClient } from '../../lib/authServerClient.js'
import {
  clearAuthCookies,
  isSameOriginRequest,
  safeAuthUser,
  setAuthCookies
} from '../../lib/authHttpOnly.js'
import { checkLoginRateLimit, clearLoginFailures, registerLoginFailure } from '../../lib/authRateLimit.js'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk))
  }
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

  const rate = checkLoginRateLimit(req)
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rate.retryAfterMs / 1000)))
    return sendJson(res, 429, { error: 'Demasiados intentos. Intenta más tarde.' })
  }

  const body = await readBody(req)
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return sendJson(res, 400, { error: 'Solicitud inválida' })
  }

  const supabase = createAuthServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email.trim().toLowerCase(),
    password: body.password
  })

  if (error || !data?.session) {
    registerLoginFailure(req)
    clearAuthCookies(res)
    return sendJson(res, 401, { error: 'Credenciales inválidas' })
  }

  clearLoginFailures(req)
  setAuthCookies(res, data.session)
  return sendJson(res, 200, {
    ok: true,
    user: safeAuthUser(data.session),
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token
  })
}

