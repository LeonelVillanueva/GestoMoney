import crypto from 'node:crypto'
import { getServerSessionFromCookies } from '../../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../../lib/authHttpOnly.js'

const SECURITY_PIN_SALT_SUFFIX = '_gestor_gastos_salt_2025'

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

  const body = await readBody(req)
  const currentPin = String(body?.currentPin || '')
  const newPin = String(body?.newPin || '')

  if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
    return sendJson(res, 400, { error: 'PIN inválido' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const { data, error } = await serverSession.supabase.rpc('verify_security_pin', { p_pin: currentPin })
  if (error) {
    return sendJson(res, 500, { error: 'Error al verificar PIN actual' })
  }

  if (data?.valid !== true) {
    return sendJson(res, 401, { error: data?.error || 'PIN actual incorrecto' })
  }

  const hashedPin = crypto
    .createHash('sha256')
    .update(`${newPin}${SECURITY_PIN_SALT_SUFFIX}`)
    .digest('hex')

  const { error: saveError } = await serverSession.supabase
    .from('config')
    .update({
      value: hashedPin,
      description: 'PIN de seguridad hasheado para eliminaciones'
    })
    .eq('user_id', serverSession.user.id)
    .eq('key', 'security_pin_hash')

  if (saveError) {
    return sendJson(res, 500, { error: 'No se pudo cambiar el PIN' })
  }

  return sendJson(res, 200, { ok: true })
}
