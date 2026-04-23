import { createAuthServerClient } from '../../lib/authServerClient.js'
import { getServerSessionFromCookies } from '../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../lib/authHttpOnly.js'

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }

  if (!isSameOriginRequest(req)) {
    return sendJson(res, 403, { error: 'Origen no autorizado' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user?.email) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const body = await readBody(req)
  const password = String(body?.password || '')
  if (!password) {
    return sendJson(res, 400, { error: 'Contraseña requerida' })
  }

  const reauthClient = createAuthServerClient()
  const { data, error } = await reauthClient.auth.signInWithPassword({
    email: serverSession.user.email,
    password
  })

  if (error || !data?.session) {
    return sendJson(res, 401, { error: 'Contraseña incorrecta' })
  }

  return sendJson(res, 200, { ok: true })
}
