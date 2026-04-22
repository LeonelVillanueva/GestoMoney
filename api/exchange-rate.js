/**
 * Vercel Serverless: tasa USD/HNL sin exponer la clave en el cliente.
 * EXCHANGE_API_KEY: solo en el panel de Vercel (servidor).
 * ALLOWED_ORIGINS: orígenes extra (p. ej. dominio custom); se fusionan con URLs de Vercel.
 */
import {
  applyCorsHeaders,
  corsHeadersForAllowedOrigin,
  originAllowedForExchangeApi,
  resolveExchangeRateAllowedOrigins
} from '../lib/exchangeRateApiSecurity.js'

function safeJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  return res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  const allowedOrigins = resolveExchangeRateAllowedOrigins(process.env)
  const origin = req.headers?.origin

  if (req.method === 'OPTIONS') {
    if (!originAllowedForExchangeApi(origin, allowedOrigins)) {
      res.statusCode = 403
      return res.end()
    }
    applyCorsHeaders(res, corsHeadersForAllowedOrigin(origin, allowedOrigins))
    res.statusCode = 204
    return res.end()
  }

  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, OPTIONS')
    return res.end('Method Not Allowed')
  }

  if (!originAllowedForExchangeApi(origin, allowedOrigins)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ error: 'Origen no autorizado' }))
  }

  applyCorsHeaders(res, corsHeadersForAllowedOrigin(origin, allowedOrigins))

  const key = process.env.EXCHANGE_API_KEY
  if (!key) {
    return safeJson(res, 501, { error: 'Servicio de tasas no configurado' })
  }

  try {
    const upstream = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/pair/USD/HNL`
    )

    if (!upstream.ok) {
      return safeJson(res, 502, { error: 'Servicio de tasas no disponible' })
    }

    const text = await upstream.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      return safeJson(res, 502, { error: 'Respuesta de tasas no válida' })
    }

    if (parsed && typeof parsed === 'object' && parsed.error && !parsed.conversion_rate) {
      return safeJson(res, 502, { error: 'Servicio de tasas no disponible' })
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    return res.end(JSON.stringify(parsed))
  } catch {
    return safeJson(res, 502, { error: 'Fallo al contactar el servicio de tasas' })
  }
}
