const MAX_ATTEMPTS = 8
const WINDOW_MS = 10 * 60 * 1000
const BLOCK_MS = 15 * 60 * 1000

const attemptsByIp = new Map()
const challengeAttempts = new Map()

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

const CHALLENGE_WINDOW_MS = 10 * 60 * 1000
const CHALLENGE_BLOCK_MS = 15 * 60 * 1000
const CHALLENGE_MAX_ATTEMPTS = 10

export function checkChallengeRateLimit(req, challengeId = 'global') {
  const key = `${getIp(req)}:${challengeId}`
  const current = challengeAttempts.get(key) || { attempts: [], blockedUntil: 0 }
  const time = now()

  if (current.blockedUntil > time) {
    return { allowed: false, retryAfterMs: current.blockedUntil - time }
  }

  const attempts = current.attempts.filter((ts) => time - ts <= CHALLENGE_WINDOW_MS)
  challengeAttempts.set(key, { attempts, blockedUntil: 0 })
  return { allowed: true, retryAfterMs: 0 }
}

export function registerChallengeFailure(req, challengeId = 'global') {
  const key = `${getIp(req)}:${challengeId}`
  const time = now()
  const current = challengeAttempts.get(key) || { attempts: [], blockedUntil: 0 }
  const attempts = [...current.attempts, time].filter((ts) => time - ts <= CHALLENGE_WINDOW_MS)
  const blockedUntil = attempts.length >= CHALLENGE_MAX_ATTEMPTS ? time + CHALLENGE_BLOCK_MS : 0
  challengeAttempts.set(key, { attempts, blockedUntil })
  return blockedUntil
}

export function clearChallengeFailures(req, challengeId = 'global') {
  const key = `${getIp(req)}:${challengeId}`
  challengeAttempts.delete(key)
}

