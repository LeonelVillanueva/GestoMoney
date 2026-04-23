import { createClient } from '@supabase/supabase-js'
import { createAuthServerClient } from '../../lib/authServerClient.js'
import {
  clearAuthCookies,
  getAuthTokensFromRequest,
  isSameOriginRequest,
  safeAuthUser,
  setAuthCookies
} from '../../lib/authHttpOnly.js'
import { checkLoginRateLimit, checkChallengeRateLimit, clearChallengeFailures, clearLoginFailures, registerChallengeFailure, registerLoginFailure } from '../../lib/authRateLimit.js'
import {
  buildOtpAuthUrl,
  decryptSensitive,
  encryptSensitive,
  extractClientIp,
  generateTotpSecret,
  hashClientIp,
  hashDeviceFingerprint,
  verifyTotpCode
} from '../../lib/auth2fa.js'
import { getServerSessionFromCookies } from '../../lib/authSessionUser.js'

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

function getPath(req) {
  return req.url?.split('?')[0] || ''
}

function createAuthAdminClient() {
  const supabaseUrl = process.env.SUPABASE_PROYECT_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_PROYECT_URL/SUPABASE_SERVICE_ROLE para auth admin')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
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

async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })

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

  const { data: mfaSettings } = await userScopedClient
    .from('user_mfa_totp')
    .select('enabled')
    .eq('user_id', userId)
    .maybeSingle()

  if (Boolean(mfaSettings?.enabled)) {
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
      const { data: challenge, error: challengeError } = await userScopedClient
        .from('auth_challenges')
        .insert({
          user_id: userId,
          challenge_type: 'login_2fa',
          reason: 'new_device_or_ip',
          device_hash: fingerprintHash,
          ip_hash: ipHash,
          session_access_encrypted: encryptSensitive(data.session.access_token),
          session_refresh_encrypted: encryptSensitive(data.session.refresh_token),
          expires_at: expiresAt
        })
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
  return sendJson(res, 200, { ok: true, user: safeAuthUser(data.session) })
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })

  const { refreshToken } = getAuthTokensFromRequest(req)
  if (refreshToken) {
    const supabase = createAuthServerClient()
    await supabase.auth.refreshSession({ refresh_token: refreshToken })
    await supabase.auth.signOut()
  }
  clearAuthCookies(res)
  return sendJson(res, 200, { ok: true })
}

async function handleSession(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { authenticated: false })

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
  return sendJson(res, 200, { authenticated: true, user: safeAuthUser(data.session) })
}

async function handle2faStatus(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) return sendJson(res, 401, { error: 'No autenticado' })

  const [mfaResult, trustedResult] = await Promise.all([
    serverSession.supabase.from('user_mfa_totp').select('enabled, updated_at').eq('user_id', serverSession.user.id).maybeSingle(),
    serverSession.supabase.from('trusted_devices').select('id, last_seen, expires_at').eq('user_id', serverSession.user.id).order('last_seen', { ascending: false }).limit(10)
  ])
  if (mfaResult.error || trustedResult.error) return sendJson(res, 500, { error: 'No se pudo obtener el estado de 2FA' })
  return sendJson(res, 200, {
    ok: true,
    enabled: Boolean(mfaResult.data?.enabled),
    updatedAt: mfaResult.data?.updated_at || null,
    trustedDevices: trustedResult.data || []
  })
}

async function handle2faVerify(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const challengeId = body?.challengeId
  const code = body?.code
  if (!challengeId || !code) return sendJson(res, 400, { error: 'Solicitud inválida' })

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
  if (challengeError || !challenge) return sendJson(res, 404, { error: 'Challenge 2FA no encontrado' })
  if (challenge.consumed_at || challenge.expires_at < nowIso || challenge.attempts >= challenge.max_attempts) {
    return sendJson(res, 401, { error: 'Challenge 2FA expirado o inválido' })
  }

  const requestDeviceHash = hashDeviceFingerprint(body?.deviceFingerprint)
  const requestIpHash = hashClientIp(extractClientIp(req))
  if (!(challenge.device_hash === requestDeviceHash && challenge.ip_hash === requestIpHash)) {
    registerChallengeFailure(req, challengeId)
    return sendJson(res, 401, { error: 'Contexto de verificación inválido' })
  }

  const { data: mfaRow, error: mfaError } = await adminClient
    .from('user_mfa_totp')
    .select('secret_encrypted, enabled')
    .eq('user_id', challenge.user_id)
    .maybeSingle()
  if (mfaError || !mfaRow?.enabled) return sendJson(res, 401, { error: '2FA no habilitado para este usuario' })

  const secret = decryptSensitive(mfaRow.secret_encrypted)
  if (!verifyTotpCode({ secret, code, window: 1 })) {
    registerChallengeFailure(req, challengeId)
    await adminClient.from('auth_challenges').update({ attempts: (challenge.attempts || 0) + 1 }).eq('id', challengeId)
    return sendJson(res, 401, { error: 'Código de autenticador inválido' })
  }
  clearChallengeFailures(req, challengeId)

  const userClient = createAuthServerClient()
  const { data: sessionData, error: setSessionError } = await userClient.auth.setSession({
    access_token: decryptSensitive(challenge.session_access_encrypted),
    refresh_token: decryptSensitive(challenge.session_refresh_encrypted)
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
  await adminClient.from('auth_challenges').update({ consumed_at: new Date().toISOString(), attempts: (challenge.attempts || 0) + 1 }).eq('id', challengeId)

  setAuthCookies(res, sessionData.session)
  return sendJson(res, 200, {
    ok: true,
    user: {
      id: sessionData.session.user?.id || null,
      email: sessionData.session.user?.email || null
    }
  })
}

async function handle2faDisable(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const code = String(body?.code || '')
  const currentPassword = String(body?.currentPassword || '')
  if (!code || !currentPassword) return sendJson(res, 400, { error: 'Código y contraseña son requeridos' })

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) return sendJson(res, 401, { error: 'No autenticado' })

  const reauthClient = createAuthServerClient()
  const { data: reauthData, error: reauthError } = await reauthClient.auth.signInWithPassword({
    email: serverSession.user.email,
    password: currentPassword
  })
  if (reauthError || !reauthData?.session) return sendJson(res, 401, { error: 'Contraseña incorrecta' })

  const { data: mfaRow, error } = await serverSession.supabase
    .from('user_mfa_totp')
    .select('secret_encrypted, enabled')
    .eq('user_id', serverSession.user.id)
    .maybeSingle()
  if (error || !mfaRow?.enabled) return sendJson(res, 404, { error: '2FA no está activo' })
  if (!verifyTotpCode({ secret: decryptSensitive(mfaRow.secret_encrypted), code, window: 1 })) {
    return sendJson(res, 401, { error: 'Código de autenticador inválido' })
  }

  const nowIso = new Date().toISOString()
  const { error: disableError } = await serverSession.supabase.from('user_mfa_totp').update({ enabled: false, updated_at: nowIso }).eq('user_id', serverSession.user.id)
  if (disableError) return sendJson(res, 500, { error: 'No se pudo desactivar 2FA' })
  await serverSession.supabase.from('trusted_devices').delete().eq('user_id', serverSession.user.id)
  await serverSession.supabase.from('auth_challenges').delete().eq('user_id', serverSession.user.id).eq('consumed_at', null)
  return sendJson(res, 200, { ok: true, enabled: false })
}

async function handle2faSetupInit(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) return sendJson(res, 401, { error: 'No autenticado' })

  const secret = generateTotpSecret()
  const encryptedSecret = encryptSensitive(secret)
  const accountName = serverSession.user.email || `user-${serverSession.user.id}`
  const otpauthUrl = buildOtpAuthUrl({ issuer: 'GestoMoney', accountName, secret })
  const { error } = await serverSession.supabase
    .from('user_mfa_totp')
    .upsert({ user_id: serverSession.user.id, secret_encrypted: encryptedSecret, enabled: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return sendJson(res, 500, { error: 'No se pudo iniciar la configuración 2FA' })
  return sendJson(res, 200, { ok: true, secret, otpauthUrl })
}

async function handle2faSetupConfirm(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const code = body?.code
  if (!code) return sendJson(res, 400, { error: 'Código requerido' })

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) return sendJson(res, 401, { error: 'No autenticado' })
  const { data: mfaRow, error } = await serverSession.supabase.from('user_mfa_totp').select('secret_encrypted').eq('user_id', serverSession.user.id).maybeSingle()
  if (error || !mfaRow?.secret_encrypted) return sendJson(res, 404, { error: 'No existe configuración 2FA pendiente' })
  if (!verifyTotpCode({ secret: decryptSensitive(mfaRow.secret_encrypted), code, window: 1 })) return sendJson(res, 401, { error: 'Código inválido' })
  const { error: updateError } = await serverSession.supabase.from('user_mfa_totp').update({ enabled: true, updated_at: new Date().toISOString() }).eq('user_id', serverSession.user.id)
  if (updateError) return sendJson(res, 500, { error: 'No se pudo activar 2FA' })
  return sendJson(res, 200, { ok: true, enabled: true })
}

export default async function handler(req, res) {
  const path = getPath(req)
  if (path === '/api/auth/login') return handleLogin(req, res)
  if (path === '/api/auth/logout') return handleLogout(req, res)
  if (path === '/api/auth/session') return handleSession(req, res)
  if (path === '/api/auth/2fa/status') return handle2faStatus(req, res)
  if (path === '/api/auth/2fa/verify') return handle2faVerify(req, res)
  if (path === '/api/auth/2fa/disable') return handle2faDisable(req, res)
  if (path === '/api/auth/2fa/setup/init') return handle2faSetupInit(req, res)
  if (path === '/api/auth/2fa/setup/confirm') return handle2faSetupConfirm(req, res)
  return sendJson(res, 404, { error: 'Ruta auth no encontrada' })
}
