import crypto from 'node:crypto'
import { getServerSessionFromCookies } from '../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../lib/authHttpOnly.js'

const SECURITY_PIN_SALT_SUFFIX = '_gestor_gastos_salt_2025'

const DEFAULT_ADVANCED_SETTINGS = {
  securityNotifyNewDevice: true,
  securityMaskSensitiveAmounts: false,
  securityAutoLockMinutes: '15'
}

const SECURITY_DB_KEYS = {
  securityNotifyNewDevice: 'seguridad_notificar_nuevo_dispositivo',
  securityMaskSensitiveAmounts: 'seguridad_ocultar_montos',
  securityAutoLockMinutes: 'seguridad_bloqueo_automatico_minutos'
}

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

async function requireSession(req, res) {
  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    sendJson(res, 401, { error: 'No autenticado' })
    return null
  }
  return serverSession
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(`${pin}${SECURITY_PIN_SALT_SUFFIX}`).digest('hex')
}

async function handlePinStatus(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const { data, error } = await serverSession.supabase
    .from('config')
    .select('value')
    .eq('user_id', serverSession.user.id)
    .eq('key', 'security_pin_hash')
    .maybeSingle()
  if (error) return sendJson(res, 500, { error: 'No se pudo verificar PIN' })
  return sendJson(res, 200, { ok: true, hasPin: Boolean(data?.value) })
}

async function handlePinSet(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const pin = String(body?.pin || '')
  if (!/^\d{6}$/.test(pin)) return sendJson(res, 400, { error: 'PIN inválido' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const payload = {
    user_id: serverSession.user.id,
    key: 'security_pin_hash',
    value: hashPin(pin),
    description: 'PIN de seguridad hasheado para eliminaciones'
  }

  const { data: updatedRows, error: updateError } = await serverSession.supabase
    .from('config')
    .update({ value: payload.value, description: payload.description })
    .eq('user_id', serverSession.user.id)
    .eq('key', payload.key)
    .select('key')
  if (updateError) return sendJson(res, 500, { error: 'Error al guardar PIN' })

  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    const { error: insertError } = await serverSession.supabase.from('config').insert(payload)
    if (insertError) {
      if (insertError.code === '23505') {
        const { data: migratedRows, error: migrateError } = await serverSession.supabase
          .from('config')
          .update({ user_id: serverSession.user.id, value: payload.value, description: payload.description })
          .eq('key', payload.key)
          .select('key')
        if (migrateError || !Array.isArray(migratedRows) || migratedRows.length === 0) {
          return sendJson(res, 500, { error: 'Error al guardar PIN' })
        }
      } else {
        return sendJson(res, 500, { error: 'Error al guardar PIN' })
      }
    }
  }

  return sendJson(res, 200, { ok: true })
}

async function handlePinVerify(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const pin = String(body?.pin || '')
  if (!/^\d{6}$/.test(pin)) return sendJson(res, 400, { error: 'PIN inválido' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const { data, error } = await serverSession.supabase.rpc('verify_security_pin', { p_pin: pin })
  if (error) return sendJson(res, 500, { error: 'Error al verificar PIN' })
  const valid = data?.valid === true
  return sendJson(res, 200, { ok: true, valid, error: valid ? null : (data?.error || 'PIN inválido') })
}

async function handlePinChange(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const currentPin = String(body?.currentPin || '')
  const newPin = String(body?.newPin || '')
  if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(newPin)) {
    return sendJson(res, 400, { error: 'PIN inválido' })
  }
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const { data, error } = await serverSession.supabase.rpc('verify_security_pin', { p_pin: currentPin })
  if (error) return sendJson(res, 500, { error: 'Error al verificar PIN actual' })
  if (data?.valid !== true) return sendJson(res, 401, { error: data?.error || 'PIN actual incorrecto' })

  const { error: saveError } = await serverSession.supabase
    .from('config')
    .update({ value: hashPin(newPin), description: 'PIN de seguridad hasheado para eliminaciones' })
    .eq('user_id', serverSession.user.id)
    .eq('key', 'security_pin_hash')
  if (saveError) return sendJson(res, 500, { error: 'No se pudo cambiar el PIN' })
  return sendJson(res, 200, { ok: true })
}

async function handlePinRemove(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const pin = String(body?.pin || '')
  if (!/^\d{6}$/.test(pin)) return sendJson(res, 400, { error: 'PIN inválido' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const { data, error } = await serverSession.supabase.rpc('verify_security_pin', { p_pin: pin })
  if (error) return sendJson(res, 500, { error: 'Error al verificar PIN' })
  if (data?.valid !== true) return sendJson(res, 401, { error: data?.error || 'PIN incorrecto' })
  const { error: deleteError } = await serverSession.supabase
    .from('config')
    .delete()
    .eq('user_id', serverSession.user.id)
    .eq('key', 'security_pin_hash')
  if (deleteError) return sendJson(res, 500, { error: 'No se pudo eliminar el PIN' })
  return sendJson(res, 200, { ok: true })
}

async function handleSettingsStatus(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const { data, error } = await serverSession.supabase
    .from('config')
    .select('key, value')
    .eq('user_id', serverSession.user.id)
    .in('key', Object.values(SECURITY_DB_KEYS))
  if (error) return sendJson(res, 500, { error: 'No se pudo cargar configuración de seguridad' })

  const map = Object.fromEntries((data || []).map((item) => [item.key, item.value]))
  return sendJson(res, 200, {
    ok: true,
    settings: {
      securityNotifyNewDevice: String(map[SECURITY_DB_KEYS.securityNotifyNewDevice] ?? DEFAULT_ADVANCED_SETTINGS.securityNotifyNewDevice) !== 'false',
      securityMaskSensitiveAmounts: String(map[SECURITY_DB_KEYS.securityMaskSensitiveAmounts] ?? DEFAULT_ADVANCED_SETTINGS.securityMaskSensitiveAmounts) === 'true',
      securityAutoLockMinutes: String(map[SECURITY_DB_KEYS.securityAutoLockMinutes] ?? DEFAULT_ADVANCED_SETTINGS.securityAutoLockMinutes)
    }
  })
}

async function handleSettingsSet(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const body = await readBody(req)
  const key = String(body?.key || '')
  const dbKey = SECURITY_DB_KEYS[key]
  if (!dbKey) return sendJson(res, 400, { error: 'Clave inválida' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const payload = {
    user_id: serverSession.user.id,
    key: dbKey,
    value: String(body?.value),
    description: 'Configuración avanzada de seguridad'
  }

  const { data: updatedRows, error: updateError } = await serverSession.supabase
    .from('config')
    .update({ value: payload.value, description: payload.description })
    .eq('user_id', serverSession.user.id)
    .eq('key', dbKey)
    .select('key')
  if (updateError) return sendJson(res, 500, { error: 'No se pudo guardar la configuración' })

  if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
    const { error: insertError } = await serverSession.supabase.from('config').insert(payload)
    if (insertError) {
      if (insertError.code === '23505') {
        const { data: migratedRows, error: migrateError } = await serverSession.supabase
          .from('config')
          .update({ user_id: serverSession.user.id, value: payload.value, description: payload.description })
          .eq('key', dbKey)
          .select('key')
        if (migrateError || !Array.isArray(migratedRows) || migratedRows.length === 0) {
          return sendJson(res, 500, { error: 'No se pudo guardar la configuración' })
        }
      } else {
        return sendJson(res, 500, { error: 'No se pudo guardar la configuración' })
      }
    }
  }

  return sendJson(res, 200, { ok: true })
}

export default async function handler(req, res) {
  const path = getPath(req)
  if (path === '/api/security/pin/status') return handlePinStatus(req, res)
  if (path === '/api/security/pin/set') return handlePinSet(req, res)
  if (path === '/api/security/pin/verify') return handlePinVerify(req, res)
  if (path === '/api/security/pin/change') return handlePinChange(req, res)
  if (path === '/api/security/pin/remove') return handlePinRemove(req, res)
  if (path === '/api/security/settings/status') return handleSettingsStatus(req, res)
  if (path === '/api/security/settings/set') return handleSettingsSet(req, res)
  return sendJson(res, 404, { error: 'Ruta security no encontrada' })
}
