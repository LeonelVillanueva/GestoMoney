import crypto from 'node:crypto'

const TOTP_DIGITS = 6
const TOTP_PERIOD_SECONDS = 30
const TOTP_SECRET_BYTES = 20
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer) {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(secret) {
  const clean = String(secret || '').replace(/=+$/g, '').toUpperCase().replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes = []

  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }

  return Buffer.from(bytes)
}

function buildEncryptionKey() {
  const configured = process.env.AUTH_2FA_ENCRYPTION_KEY
  const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL_ENV)

  if (isProduction && !configured) {
    throw new Error('AUTH_2FA_ENCRYPTION_KEY es obligatoria en producción')
  }

  const raw = configured || 'local-dev-key'
  return crypto.createHash('sha256').update(raw).digest()
}

function buildLegacyEncryptionKeys() {
  const legacyRawKeys = [process.env.SUPABASE_ANON_PUBLIC, 'local-dev-key'].filter(Boolean)
  const unique = [...new Set(legacyRawKeys)]
  return unique.map((raw) => crypto.createHash('sha256').update(raw).digest())
}

export function encryptSensitive(plainText) {
  const key = buildEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${encrypted.toString('base64url')}.${tag.toString('base64url')}`
}

export function decryptSensitive(payload) {
  const [ivRaw, dataRaw, tagRaw] = String(payload || '').split('.')
  if (!ivRaw || !dataRaw || !tagRaw) throw new Error('Payload cifrado inválido')
  const iv = Buffer.from(ivRaw, 'base64url')
  const data = Buffer.from(dataRaw, 'base64url')
  const tag = Buffer.from(tagRaw, 'base64url')

  const keyCandidates = [buildEncryptionKey(), ...buildLegacyEncryptionKeys()]
  let lastError = null

  for (const key of keyCandidates) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(tag)
      const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
      return decrypted.toString('utf8')
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('No se pudo descifrar el payload')
}

function hmacTotp(secretBase32, counter) {
  const secret = base32Decode(secretBase32)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff)
  return String(code % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0')
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(TOTP_SECRET_BYTES))
}

export function buildOtpAuthUrl({ issuer, accountName, secret }) {
  const safeIssuer = encodeURIComponent(issuer)
  const safeAccount = encodeURIComponent(accountName)
  return `otpauth://totp/${safeIssuer}:${safeAccount}?secret=${secret}&issuer=${safeIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`
}

export function verifyTotpCode({ secret, code, window = 1, now = Date.now() }) {
  const normalizedCode = String(code || '').replace(/\s+/g, '')
  if (!/^\d{6}$/.test(normalizedCode)) return false
  const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS)
  for (let i = -window; i <= window; i += 1) {
    const expected = hmacTotp(secret, counter + i)
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(normalizedCode))) {
      return true
    }
  }
  return false
}

function hashWithPepper(value, pepper = process.env.AUTH_2FA_HASH_PEPPER || '') {
  return crypto.createHash('sha256').update(`${pepper}:${String(value || '')}`).digest('hex')
}

export function hashDeviceFingerprint(fingerprint) {
  return hashWithPepper(fingerprint || 'unknown-device')
}

export function extractClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown-ip'
}

export function hashClientIp(ip) {
  return hashWithPepper(ip || 'unknown-ip')
}
