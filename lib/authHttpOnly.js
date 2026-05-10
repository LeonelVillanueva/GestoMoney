const ACCESS_COOKIE = 'gg_access_token'
const REFRESH_COOKIE = 'gg_refresh_token'
export const TRUSTED_DEVICE_COOKIE = 'gg_trusted_device'

const FIFTEEN_MINUTES = 15 * 60
const THIRTY_DAYS = 30 * 24 * 60 * 60

function isProductionEnv(env = process.env) {
  return env.NODE_ENV === 'production' || Boolean(env.VERCEL_ENV)
}

function buildCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value ?? '')}`]
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.secure) parts.push('Secure')
  if (options.path) parts.push(`Path=${options.path}`)
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  return parts.join('; ')
}

function safeDecodeCookieValue(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function parseCookies(cookieHeader = '') {
  if (!cookieHeader) return {}
  return cookieHeader.split(';').reduce((acc, token) => {
    const idx = token.indexOf('=')
    if (idx <= 0) return acc
    const key = token.slice(0, idx).trim()
    const value = token.slice(idx + 1).trim()
    acc[key] = safeDecodeCookieValue(value)
    return acc
  }, {})
}

export function buildTrustedDeviceCookie(rawToken, env = process.env) {
  if (!rawToken || typeof rawToken !== 'string') return null
  const secure = isProductionEnv(env)
  return buildCookie(TRUSTED_DEVICE_COOKIE, rawToken, {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    maxAge: THIRTY_DAYS
  })
}

export function getTrustedDeviceTokenFromRequest(req) {
  const parsed = parseCookies(req.headers?.cookie || '')
  const v = parsed[TRUSTED_DEVICE_COOKIE]
  return v && typeof v === 'string' && v.length > 0 ? v : null
}

/** Opcionalmente envía cookie HTTP-only `gg_trusted_device` con token opaco (solo servidor interpreta el hash en BD). */
export function setAuthCookies(res, session, env = process.env, trustedDeviceRawToken = null) {
  const secure = isProductionEnv(env)
  const cookies = [
    buildCookie(ACCESS_COOKIE, session.access_token, {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      path: '/',
      maxAge: FIFTEEN_MINUTES
    }),
    buildCookie(REFRESH_COOKIE, session.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      path: '/',
      maxAge: THIRTY_DAYS
    })
  ]
  const td = buildTrustedDeviceCookie(trustedDeviceRawToken, env)
  if (td) cookies.push(td)
  res.setHeader('Set-Cookie', cookies)
}

/** Expira solo la cookie de dispositivo de confianza (sin cerrar sesión). */
export function appendClearTrustedDeviceCookie(res, env = process.env) {
  const secure = isProductionEnv(env)
  const expiredTd = buildCookie(TRUSTED_DEVICE_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0
  })
  const prev = res.getHeader('Set-Cookie')
  if (!prev) {
    res.setHeader('Set-Cookie', expiredTd)
  } else if (Array.isArray(prev)) {
    res.setHeader('Set-Cookie', [...prev, expiredTd])
  } else {
    res.setHeader('Set-Cookie', [prev, expiredTd])
  }
}

export function clearAuthCookies(res, env = process.env) {
  const secure = isProductionEnv(env)
  const expired = [
    buildCookie(ACCESS_COOKIE, '', {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      path: '/',
      maxAge: 0
    }),
    buildCookie(REFRESH_COOKIE, '', {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      path: '/',
      maxAge: 0
    }),
    buildCookie(TRUSTED_DEVICE_COOKIE, '', {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      path: '/',
      maxAge: 0
    })
  ]
  res.setHeader('Set-Cookie', expired)
}

export function getAuthTokensFromRequest(req) {
  const parsed = parseCookies(req.headers?.cookie || '')
  return {
    accessToken: parsed[ACCESS_COOKIE] || null,
    refreshToken: parsed[REFRESH_COOKIE] || null
  }
}

export function safeAuthUser(session) {
  if (!session?.user) return null
  return {
    id: session.user.id,
    email: session.user.email || null
  }
}

export function isSameOriginRequest(req) {
  const origin = req.headers?.origin
  const host = req.headers?.host
  if (!origin || !host) return true
  try {
    const parsed = new URL(origin)
    return parsed.host === host
  } catch {
    return false
  }
}
