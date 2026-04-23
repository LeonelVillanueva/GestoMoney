import { createAuthServerClient } from '../../lib/authServerClient.js'
import {
  clearAuthCookies,
  isSameOriginRequest,
  safeAuthUser,
  setAuthCookies
} from '../../lib/authHttpOnly.js'
import { checkLoginRateLimit, clearLoginFailures, registerLoginFailure } from '../../lib/authRateLimit.js'
import {
  encryptSensitive,
  extractClientIp,
  hashClientIp,
  hashDeviceFingerprint
} from '../../lib/auth2fa.js'

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

async function createUserScopedClient(session) {
  const client = createAuthServerClient()
  const { error } = await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  })
  if (error) throw error
  return client
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

  const userScopedClient = await createUserScopedClient(data.session)
  const userId = data.session.user?.id
  const fingerprintHash = hashDeviceFingerprint(body.deviceFingerprint)
  const ipHash = hashClientIp(extractClientIp(req))
  const nowIso = new Date().toISOString()

  // Si el usuario no tiene 2FA activo, flujo normal.
  const { data: mfaSettings } = await userScopedClient
    .from('user_mfa_totp')
    .select('enabled')
    .eq('user_id', userId)
    .maybeSingle()

  const requires2fa = Boolean(mfaSettings?.enabled)

  if (requires2fa) {
    const { data: trustedDevice } = await userScopedClient
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_hash', fingerprintHash)
      .eq('ip_hash', ipHash)
      .gt('expires_at', nowIso)
      .maybeSingle()

    if (!trustedDevice) {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
      const challengePayload = {
        user_id: userId,
        challenge_type: 'login_2fa',
        reason: 'new_device_or_ip',
        device_hash: fingerprintHash,
        ip_hash: ipHash,
        session_access_encrypted: encryptSensitive(data.session.access_token),
        session_refresh_encrypted: encryptSensitive(data.session.refresh_token),
        expires_at: expiresAt
      }

      const { data: challenge, error: challengeError } = await userScopedClient
        .from('auth_challenges')
        .insert(challengePayload)
        .select('id, expires_at')
        .single()

      if (challengeError || !challenge?.id) {
        registerLoginFailure(req)
        clearAuthCookies(res)
        return sendJson(res, 500, { error: 'No se pudo iniciar el desafío 2FA' })
      }

      clearLoginFailures(req)
      clearAuthCookies(res)
      return sendJson(res, 200, {
        ok: true,
        requires2fa: true,
        challengeId: challenge.id,
        challengeExpiresAt: challenge.expires_at
      })
    }

    await userScopedClient
      .from('trusted_devices')
      .update({
        last_seen: nowIso,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', trustedDevice.id)
  }

  clearLoginFailures(req)
  setAuthCookies(res, data.session)
  return sendJson(res, 200, {
    ok: true,
    user: safeAuthUser(data.session)
  })
}

