import React, { useState } from 'react'
import { browserLabelFromUserAgent } from '../../lib/trustedDeviceDisplay.js'
import notifications from '../utils/services/notifications'

function typeIcon(type) {
  if (type === 'mobile') return '📱'
  if (type === 'tablet') return '📱'
  return '💻'
}

function typeLabel(type) {
  if (type === 'mobile') return 'Móvil'
  if (type === 'tablet') return 'Tablet'
  if (type === 'desktop') return 'PC / Escritorio'
  return 'Dispositivo'
}

/**
 * @param {object} props
 * @param {Array<{ id: string, lastSeen: string, expiresAt: string, userAgent?: string, ipAddress?: string, deviceType?: string, isThisDevice?: boolean }>} props.devices
 * @param {() => void} props.onRefresh
 * @param {boolean} props.enabled - 2FA activo
 */
export default function TrustedDevicesPanel({ devices = [], onRefresh, enabled }) {
  const [busyId, setBusyId] = useState(null)
  const [clearing, setClearing] = useState(false)

  const handleRevoke = async (id) => {
    const ok = await notifications.confirm({
      title: 'Revocar dispositivo',
      message:
        'Se quitará de la lista de confianza. En el próximo inicio desde esa IP y dispositivo se pedirá de nuevo el código 2FA. La sesión actual en ese aparato podría seguir activa hasta que expire o cierren sesión allí.',
      confirmText: 'Revocar',
      cancelText: 'Cancelar',
      tone: 'warning'
    })
    if (!ok) return
    setBusyId(id)
    try {
      const res = await fetch('/api/auth/trusted-devices/revoke', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload?.ok) {
        notifications.showSync(payload?.error || 'No se pudo revocar', 'error')
        return
      }
      notifications.showSync('Dispositivo revocado. Deberá verificar 2FA al volver a entrar.', 'success')
      onRefresh?.()
    } catch {
      notifications.showSync('Error de red al revocar', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleClearAll = async () => {
    const ok = await notifications.confirm({
      title: 'Cerrar sesión en todos lados',
      message:
        'Se eliminarán todos los dispositivos de confianza y se cerrará la sesión en todos los aparatos (incluido este). Tendrás que iniciar sesión de nuevo y, si el 2FA sigue activo, pasar el desafío en equipos nuevos o no confiables.',
      confirmText: 'Sí, cerrar todo',
      cancelText: 'Cancelar',
      tone: 'error'
    })
    if (!ok) return
    setClearing(true)
    try {
      const res = await fetch('/api/auth/trusted-devices/clear-all', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload?.ok) {
        notifications.showSync(payload?.error || 'No se pudo completar', 'error')
        return
      }
      notifications.showSync('Sesiones terminadas. Redirigiendo al inicio de sesión…', 'info', 2000)
      setTimeout(() => {
        window.location.reload()
      }, 400)
    } catch {
      notifications.showSync('Error de red', 'error')
    } finally {
      setClearing(false)
    }
  }

  if (!enabled) {
    return (
      <p className="text-xs text-zinc-500">
        Activa el 2FA para registrar dispositivos en los que ya verificaste con el código del autenticador.
      </p>
    )
  }

  if (!devices.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-4 text-center text-sm text-zinc-500">
        Aún no hay dispositivos de confianza. Aparecerán al iniciar sesión y completar el desafío 2FA en un equipo o IP
        nuevos.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-400">
          Dispositivos que ya pasaron verificación 2FA en esta cuenta (máx. 30 días de confianza por registro).
        </p>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={clearing}
          className="shrink-0 rounded-lg border border-rose-500/50 bg-rose-950/40 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900/50 disabled:opacity-50"
        >
          {clearing ? 'Aplicando…' : 'Cerrar sesión en todos los dispositivos'}
        </button>
      </div>
      <ul className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
        {devices.map((d) => {
          const ua = d.userAgent || ''
          const kind = d.deviceType || 'unknown'
          return (
            <li
              key={d.id}
              className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 shadow-lg shadow-black/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-2xl" aria-hidden>
                    {typeIcon(kind)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">
                      {typeLabel(kind)}
                      {d.isThisDevice && (
                        <span className="ml-2 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-200">
                          Este dispositivo
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-500" title={browserLabelFromUserAgent(ua)}>
                      {browserLabelFromUserAgent(ua)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(d.id)}
                  disabled={busyId === d.id}
                  className="shrink-0 rounded-lg border border-zinc-600 px-2.5 py-1 text-[11px] text-zinc-200 hover:border-rose-500/60 hover:text-rose-200 disabled:opacity-50"
                >
                  {busyId === d.id ? '…' : 'Revocar'}
                </button>
              </div>
              <dl className="mt-3 space-y-1.5 text-[11px] text-zinc-400">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-zinc-500">IP aprox.:</dt>
                  <dd className="font-mono text-zinc-300">{d.ipAddress || '—'}</dd>
                </div>
                {ua && (
                  <div>
                    <dt className="text-zinc-500">User agent:</dt>
                    <dd className="mt-0.5 break-all font-mono text-[10px] leading-relaxed text-zinc-500">{ua}</dd>
                  </div>
                )}
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-zinc-500">Último acceso:</dt>
                  <dd>
                    {d.lastSeen
                      ? new Date(d.lastSeen).toLocaleString('es-HN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })
                      : '—'}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-zinc-500">Vence confianza:</dt>
                  <dd>
                    {d.expiresAt
                      ? new Date(d.expiresAt).toLocaleString('es-HN', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })
                      : '—'}
                  </dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
