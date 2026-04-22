/**
 * CORS y comprobación de origen para GET/OPTIONS de /api/exchange-rate.
 * Usado en Vite (dev/preview) y en la función serverless de Vercel.
 */

const LOCAL_DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://[::1]:5173',
  'http://[::1]:4173'
]

export function parseAllowedOriginsCsv(csv) {
  if (!csv || typeof csv !== 'string') return []
  return csv.split(',').map((s) => s.trim()).filter(Boolean)
}

function withHttps(urlOrHost) {
  if (!urlOrHost) return null
  if (urlOrHost.startsWith('http://') || urlOrHost.startsWith('https://')) return urlOrHost
  return `https://${urlOrHost}`
}

/**
 * Orígenes permitidos para el navegador al llamar a /api/exchange-rate.
 * - ALLOWED_ORIGINS: lista separada por comas (incluye dominios custom en Vercel).
 * - En Vercel se añaden VERCEL_URL y VERCEL_PROJECT_PRODUCTION_URL si existen.
 * - Fuera de Vercel y sin ALLOWED_ORIGINS: solo orígenes locales típicos de Vite.
 */
export function resolveExchangeRateAllowedOrigins(env) {
  const set = new Set(parseAllowedOriginsCsv(env.ALLOWED_ORIGINS || ''))

  for (const key of ['VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL']) {
    const v = env[key]
    const normalized = withHttps(v)
    if (normalized) set.add(normalized)
  }

  if (set.size > 0) return [...set]
  return [...LOCAL_DEFAULT_ORIGINS]
}

export function originAllowedForExchangeApi(originHeader, allowedOrigins) {
  if (!originHeader) return true
  return allowedOrigins.includes(originHeader)
}

export function corsHeadersForAllowedOrigin(originHeader, allowedOrigins) {
  if (!originHeader || !allowedOrigins.includes(originHeader)) return {}
  return {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  }
}

export function applyCorsHeaders(res, headersObj) {
  for (const [k, v] of Object.entries(headersObj)) {
    if (v !== undefined && v !== null) res.setHeader(k, v)
  }
}
