import { getServerSessionFromCookies } from '../../../lib/authSessionUser.js'
import { isSameOriginRequest } from '../../../lib/authHttpOnly.js'

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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET')
    return res.end('Method Not Allowed')
  }

  if (!isSameOriginRequest(req)) {
    return sendJson(res, 403, { error: 'Origen no autorizado' })
  }

  const serverSession = await getServerSessionFromCookies(req, res)
  if (!serverSession?.user) {
    return sendJson(res, 401, { error: 'No autenticado' })
  }

  const { data, error } = await serverSession.supabase
    .from('config')
    .select('key, value')
    .eq('user_id', serverSession.user.id)
    .in('key', Object.values(SECURITY_DB_KEYS))

  if (error) {
    return sendJson(res, 500, { error: 'No se pudo cargar configuración de seguridad' })
  }

  const map = Object.fromEntries((data || []).map((item) => [item.key, item.value]))
  return sendJson(res, 200, {
    ok: true,
    settings: {
      securityNotifyNewDevice:
        String(map[SECURITY_DB_KEYS.securityNotifyNewDevice] ?? DEFAULT_ADVANCED_SETTINGS.securityNotifyNewDevice) !== 'false',
      securityMaskSensitiveAmounts:
        String(map[SECURITY_DB_KEYS.securityMaskSensitiveAmounts] ?? DEFAULT_ADVANCED_SETTINGS.securityMaskSensitiveAmounts) === 'true',
      securityAutoLockMinutes:
        String(map[SECURITY_DB_KEYS.securityAutoLockMinutes] ?? DEFAULT_ADVANCED_SETTINGS.securityAutoLockMinutes)
    }
  })
}
