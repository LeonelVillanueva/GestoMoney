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
  return req.url?.split('?')[0] || ''
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

export default async function handler(req, res) {
  const path = getPath(req)
  if (path === '/api/account/verify-password') return handleVerifyPassword(req, res)
  if (path === '/api/account/change-password') return handleChangePassword(req, res)
  if (path === '/api/account/change-email') return handleChangeEmail(req, res)
  return sendJson(res, 404, { error: 'Ruta account no encontrada' })
}
