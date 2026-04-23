import { createClient } from '@supabase/supabase-js'
import { createAuthServerClient } from '../../../lib/authServerClient.js'
import { clearAuthCookies, isSameOriginRequest, setAuthCookies } from '../../../lib/authHttpOnly.js'
import {
  clearChallengeFailures,
  checkChallengeRateLimit,
  registerChallengeFailure
} from '../../../lib/authRateLimit.js'
import {
  decryptSensitive,
  extractClientIp,
  hashClientIp,
  hashDeviceFingerprint,
  verifyTotpCode
} from '../../../lib/auth2fa.js'

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

function createAuthAdminClient() {
  const supabaseUrl = process.env.SUPABASE_PROYECT_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_PROYECT_URL/SUPABASE_SERVICE_ROLE para verificar 2FA')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
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
  const challengeId = body?.challengeId
  const code = body?.code
  if (!challengeId || !code) {
    return sendJson(res, 400, { error: 'Solicitud inválida' })
  }

  const rate = checkChallengeRateLimit(req, challengeId)
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rate.retryAfterMs / 1000)))
    return sendJson(res, 429, { error: 'Demasiados intentos de verificación 2FA.' })
  }

  const adminClient = createAuthAdminClient()
  const nowIso = new Date().toISOString()
  const { data: challenge, error: challengeError } = await adminClient
    .from('auth_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('challenge_type', 'login_2fa')
    .maybeSingle()

  if (challengeError || !challenge) {
    return sendJson(res, 404, { error: 'Challenge 2FA no encontrado' })
  }

  if (challenge.consumed_at || challenge.expires_at < nowIso || challenge.attempts >= challenge.max_attempts) {
    return sendJson(res, 401, { error: 'Challenge 2FA expirado o inválido' })
  }

  const requestDeviceHash = hashDeviceFingerprint(body?.deviceFingerprint)
  const requestIpHash = hashClientIp(extractClientIp(req))
  const matchesContext = challenge.device_hash === requestDeviceHash && challenge.ip_hash === requestIpHash
  if (!matchesContext) {
    registerChallengeFailure(req, challengeId)
    return sendJson(res, 401, { error: 'Contexto de verificación inválido' })
  }

  const { data: mfaRow, error: mfaError } = await adminClient
    .from('user_mfa_totp')
    .select('secret_encrypted, enabled')
    .eq('user_id', challenge.user_id)
    .maybeSingle()

  if (mfaError || !mfaRow?.enabled) {
    return sendJson(res, 401, { error: '2FA no habilitado para este usuario' })
  }

  const secret = decryptSensitive(mfaRow.secret_encrypted)
  const okCode = verifyTotpCode({ secret, code, window: 1 })
  if (!okCode) {
    registerChallengeFailure(req, challengeId)
    await adminClient
      .from('auth_challenges')
      .update({ attempts: (challenge.attempts || 0) + 1 })
      .eq('id', challengeId)
    return sendJson(res, 401, { error: 'Código de autenticador inválido' })
  }

  clearChallengeFailures(req, challengeId)

  const accessToken = decryptSensitive(challenge.session_access_encrypted)
  const refreshToken = decryptSensitive(challenge.session_refresh_encrypted)

  const userClient = createAuthServerClient()
  const { data: sessionData, error: setSessionError } = await userClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  if (setSessionError || !sessionData?.session) {
    clearAuthCookies(res)
    return sendJson(res, 500, { error: 'No se pudo finalizar la sesión 2FA' })
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await adminClient.from('trusted_devices').upsert({
    user_id: challenge.user_id,
    device_hash: requestDeviceHash,
    ip_hash: requestIpHash,
    last_seen: new Date().toISOString(),
    expires_at: expiresAt
  }, { onConflict: 'user_id,device_hash,ip_hash' })

  await adminClient
    .from('auth_challenges')
    .update({ consumed_at: new Date().toISOString(), attempts: (challenge.attempts || 0) + 1 })
    .eq('id', challengeId)

  setAuthCookies(res, sessionData.session)
  return sendJson(res, 200, {
    ok: true,
    user: {
      id: sessionData.session.user?.id || null,
      email: sessionData.session.user?.email || null
    }
  })
}
