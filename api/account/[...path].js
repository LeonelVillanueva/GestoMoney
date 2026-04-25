import { createClient } from '@supabase/supabase-js'
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

function getPath(req) {
  const raw = req.url?.split('?')[0] || ''
  if (raw.length > 1 && raw.endsWith('/')) {
    return raw.slice(0, -1)
  }
  return raw
}

function parseQueryString(req) {
  const u = req.url || ''
  const i = u.indexOf('?')
  if (i < 0) return new URLSearchParams()
  return new URLSearchParams(u.slice(i + 1))
}

function createAuthAdminClient() {
  const supabaseUrl = process.env.SUPABASE_PROYECT_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_PROYECT_URL/SUPABASE_SERVICE_ROLE para operaciones de cuenta')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

async function requireSession(req, res) {
  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user?.email) {
    sendJson(res, 401, { error: 'No autenticado' })
    return null
  }
  return serverSession
}

async function handleVerifyPassword(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const body = await readBody(req)
  const password = String(body?.password || '')
  if (!password) return sendJson(res, 400, { error: 'Contraseña requerida' })

  const reauthClient = createAuthServerClient()
  const { data, error } = await reauthClient.auth.signInWithPassword({
    email: serverSession.user.email,
    password
  })
  if (error || !data?.session) return sendJson(res, 401, { error: 'Contraseña incorrecta' })
  return sendJson(res, 200, { ok: true })
}

async function handleChangePassword(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const body = await readBody(req)
  const currentPassword = String(body?.currentPassword || '')
  const newPassword = String(body?.newPassword || '')
  if (!currentPassword || !newPassword) {
    return sendJson(res, 400, { error: 'Contraseña actual y nueva son requeridas' })
  }
  if (newPassword.length < 6) {
    return sendJson(res, 400, { error: 'La nueva contraseña debe tener al menos 6 caracteres' })
  }
  if (currentPassword === newPassword) {
    return sendJson(res, 400, { error: 'La nueva contraseña debe ser diferente a la actual' })
  }

  const reauthClient = createAuthServerClient()
  const { data: reauthData, error: reauthError } = await reauthClient.auth.signInWithPassword({
    email: serverSession.user.email,
    password: currentPassword
  })
  if (reauthError || !reauthData?.session) return sendJson(res, 401, { error: 'Contraseña actual incorrecta' })

  const adminClient = createAuthAdminClient()
  const { error: updateError } = await adminClient.auth.admin.updateUserById(serverSession.user.id, {
    password: newPassword
  })
  if (updateError) return sendJson(res, 500, { error: 'No se pudo cambiar la contraseña' })
  return sendJson(res, 200, { ok: true })
}

async function handleChangeEmail(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const body = await readBody(req)
  const currentPassword = String(body?.currentPassword || '')
  const newEmail = String(body?.newEmail || '').trim().toLowerCase()
  if (!currentPassword || !newEmail) return sendJson(res, 400, { error: 'Email y contraseña son requeridos' })
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) return sendJson(res, 400, { error: 'Email no válido' })
  if (newEmail === String(serverSession.user.email || '').toLowerCase()) {
    return sendJson(res, 400, { error: 'El nuevo email debe ser diferente al actual' })
  }

  const reauthClient = createAuthServerClient()
  const { data: reauthData, error: reauthError } = await reauthClient.auth.signInWithPassword({
    email: serverSession.user.email,
    password: currentPassword
  })
  if (reauthError || !reauthData?.session) return sendJson(res, 401, { error: 'Contraseña incorrecta' })

  const adminClient = createAuthAdminClient()
  const { error: updateError } = await adminClient.auth.admin.updateUserById(serverSession.user.id, {
    email: newEmail
  })
  if (updateError) return sendJson(res, 500, { error: 'No se pudo actualizar el email' })
  return sendJson(res, 200, { ok: true, needsConfirmation: true })
}

/**
 * Lee config del usuario (GET ?key= o todas las claves sin query).
 */
async function handleConfigGet(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const key = String(parseQueryString(req).get('key') || '')
  const userId = serverSession.user.id
  const client = serverSession.supabase

  if (key) {
    const { data, error } = await client
      .from('config')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle()
    if (error) return sendJson(res, 500, { error: error.message || 'Error al leer configuración' })
    return sendJson(res, 200, { value: data?.value ?? null })
  }

  const { data, error } = await client.from('config').select('key, value').eq('user_id', userId)
  if (error) return sendJson(res, 500, { error: error.message || 'Error al leer configuración' })
  const config = {}
  for (const row of data || []) {
    if (row?.key) config[row.key] = row.value
  }
  return sendJson(res, 200, { config })
}

/**
 * Guarda una fila en public.config con la sesión de cookies (modo auth HttpOnly: el JS no
 * tiene el JWT, pero el backend sí).
 */
async function handleConfigSet(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method Not Allowed')
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Origen no autorizado' })
  const serverSession = await requireSession(req, res)
  if (!serverSession) return

  const body = await readBody(req)
  const key = String(body?.key || '')
  const { value, description: descIn } = body || {}
  if (!key) return sendJson(res, 400, { error: 'Falta key' })
  if (value === undefined || value === null) return sendJson(res, 400, { error: 'Falta value' })
  const description = String(descIn || '')

  const userId = serverSession.user.id
  const client = serverSession.supabase
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value)

  const payload = { user_id: userId, key, value: valueStr, description }

  const { data: updatedRows, error: updateError } = await client
    .from('config')
    .update({ value: payload.value, description: payload.description })
    .eq('user_id', userId)
    .eq('key', key)
    .select('key')

  if (updateError) return sendJson(res, 500, { error: updateError.message || 'Error al actualizar configuración' })
  if (Array.isArray(updatedRows) && updatedRows.length > 0) return sendJson(res, 200, { ok: true })

  const { error: insertError } = await client.from('config').insert(payload)
  if (!insertError) return sendJson(res, 200, { ok: true })

  if (insertError.code === '23505') {
    const { data: migratedRows, error: migrateError } = await client
      .from('config')
      .update({ user_id: userId, value: payload.value, description: payload.description })
      .eq('key', key)
      .select('key')
    if (migrateError) return sendJson(res, 500, { error: migrateError.message || 'Error al migrar configuración' })
    if (Array.isArray(migratedRows) && migratedRows.length > 0) return sendJson(res, 200, { ok: true })
  }

  return sendJson(res, 500, { error: insertError.message || 'Error al guardar configuración' })
}

export default async function handler(req, res) {
  const path = getPath(req)
  if (path === '/api/account/verify-password') return handleVerifyPassword(req, res)
  if (path === '/api/account/change-password') return handleChangePassword(req, res)
  if (path === '/api/account/change-email') return handleChangeEmail(req, res)
  if (path === '/api/account/config') {
    if (req.method === 'GET') return handleConfigGet(req, res)
    if (req.method === 'POST') return handleConfigSet(req, res)
    res.statusCode = 405
    res.setHeader('Allow', 'GET, POST')
    return res.end('Method Not Allowed')
  }
  return sendJson(res, 404, { error: 'Ruta account no encontrada' })
}
