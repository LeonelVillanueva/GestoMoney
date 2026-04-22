const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000
const BLOCK_MS = 15 * 60 * 1000

const attemptsByIp = new Map()

function now() {
  return Date.now()
}

function getIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

export function checkLoginRateLimit(req) {
  const ip = getIp(req)
  const current = attemptsByIp.get(ip) || { attempts: [], blockedUntil: 0 }
  const time = now()

  if (current.blockedUntil > time) {
    return {
      allowed: false,
      retryAfterMs: current.blockedUntil - time
    }
  }

  const filteredAttempts = current.attempts.filter((ts) => time - ts <= WINDOW_MS)
  attemptsByIp.set(ip, { attempts: filteredAttempts, blockedUntil: 0 })
  return { allowed: true, retryAfterMs: 0 }
}

export function registerLoginFailure(req) {
  const ip = getIp(req)
  const time = now()
  const current = attemptsByIp.get(ip) || { attempts: [], blockedUntil: 0 }
  const attempts = [...current.attempts, time].filter((ts) => time - ts <= WINDOW_MS)
  const blockedUntil = attempts.length >= MAX_ATTEMPTS ? time + BLOCK_MS : 0
  attemptsByIp.set(ip, { attempts, blockedUntil })
  return blockedUntil
}

export function clearLoginFailures(req) {
  const ip = getIp(req)
  attemptsByIp.delete(ip)
}

