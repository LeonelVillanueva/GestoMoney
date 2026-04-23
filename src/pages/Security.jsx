import React, { useCallback, useEffect, useMemo, useState } from 'react'
import SecurityTab from './settings/SecurityTab'
import { useAuth } from '../contexts/AuthContext'
import useSecurityPin from '../hooks/useSecurityPin'
import settingsManager from '../utils/services/settings'
import notifications from '../utils/services/notifications'

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

const Security = () => {
  const { user } = useAuth()
  const { hasPin, loading: pinLoading, checkPinExists } = useSecurityPin()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [trustedDevicesCount, setTrustedDevicesCount] = useState(0)
  const [advancedSettings, setAdvancedSettings] = useState(DEFAULT_ADVANCED_SETTINGS)
  const [savingKey, setSavingKey] = useState('')

  const loadSecurityStatus = useCallback(async () => {
    try {
      await checkPinExists()
      const response = await fetch('/api/auth/2fa/status', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const payload = await response.json()
      if (!response.ok || !payload?.ok) return
      setTwoFactorEnabled(Boolean(payload.enabled))
      setTrustedDevicesCount(Array.isArray(payload.trustedDevices) ? payload.trustedDevices.length : 0)
    } catch {
      // Evita bloquear la UI por errores de red intermitentes.
    }
  }, [checkPinExists])

  const loadAdvancedSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/security/settings/status', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok || !payload?.settings) {
        throw new Error(payload?.error || 'No se pudo cargar configuración avanzada')
      }
      const next = payload.settings
      setAdvancedSettings(next)
      Object.entries(next).forEach(([key, value]) => settingsManager.set(key, value))
    } catch {
      setAdvancedSettings((prev) => ({ ...prev, ...DEFAULT_ADVANCED_SETTINGS }))
    }
  }, [])

  useEffect(() => {
    loadSecurityStatus()
    loadAdvancedSettings()
  }, [loadSecurityStatus, loadAdvancedSettings])

  const securityScore = useMemo(() => {
    let score = 35
    if (hasPin) score += 25
    if (twoFactorEnabled) score += 30
    if (advancedSettings.securityNotifyNewDevice) score += 5
    if (advancedSettings.securityAutoLockMinutes !== 'off') score += 5
    return Math.min(score, 100)
  }, [hasPin, twoFactorEnabled, advancedSettings.securityNotifyNewDevice, advancedSettings.securityAutoLockMinutes])

  const saveAdvancedSetting = async (key, value) => {
    setAdvancedSettings((prev) => ({ ...prev, [key]: value }))
    settingsManager.set(key, value)
    setSavingKey(key)
    try {
      const response = await fetch('/api/security/settings/set', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'No se pudo guardar')
      }
      notifications.showSync('Configuración de seguridad actualizada', 'success', 1600)
    } catch {
      notifications.showSync('No se pudo guardar la configuración de seguridad', 'error')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 animate-fade-in">
      <section className="glass-card rounded-xl p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">Seguridad</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Centro de protección de cuenta, autenticación y controles sensibles.
            </p>
            <p className="mt-1 text-xs text-zinc-500">Usuario activo: {user?.email || 'No disponible'}</p>
          </div>
          <button
            type="button"
            onClick={loadSecurityStatus}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Revalidar estado
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Puntaje de seguridad</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{securityScore}%</p>
          <p className="mt-1 text-xs text-zinc-400">Basado en PIN, 2FA y controles avanzados.</p>
        </article>
        <article className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">2FA por riesgo</p>
          <p className="mt-2 text-base font-semibold text-zinc-100">{twoFactorEnabled ? 'Activo' : 'Inactivo'}</p>
          <p className="mt-1 text-xs text-zinc-400">
            Dispositivos confiables registrados: {twoFactorEnabled ? trustedDevicesCount : 0}
          </p>
        </article>
        <article className="glass-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">PIN de protección</p>
          <p className="mt-2 text-base font-semibold text-zinc-100">
            {pinLoading ? 'Verificando...' : hasPin ? 'Configurado' : 'No configurado'}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Protege edición y eliminación de datos sensibles.</p>
        </article>
      </section>

      <section className="glass-card rounded-xl p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Opciones avanzadas</h3>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">Notificar intento desde nuevo dispositivo</p>
            <p className="text-xs text-zinc-500">Muestra aviso inmediato cuando el login entra a desafío 2FA.</p>
          </div>
          <input
            type="checkbox"
            checked={advancedSettings.securityNotifyNewDevice}
            onChange={(e) => saveAdvancedSetting('securityNotifyNewDevice', e.target.checked)}
            disabled={savingKey === 'securityNotifyNewDevice'}
            className="h-4 w-4 accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">Ocultar montos sensibles en listados</p>
            <p className="text-xs text-zinc-500">Preparado para activar en vistas compartidas o de demostración.</p>
          </div>
          <input
            type="checkbox"
            checked={advancedSettings.securityMaskSensitiveAmounts}
            onChange={(e) => saveAdvancedSetting('securityMaskSensitiveAmounts', e.target.checked)}
            disabled={savingKey === 'securityMaskSensitiveAmounts'}
            className="h-4 w-4 accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">Bloqueo automático por inactividad</p>
            <p className="text-xs text-zinc-500">Tiempo de espera recomendado antes de solicitar revalidación.</p>
          </div>
          <select
            value={advancedSettings.securityAutoLockMinutes}
            onChange={(e) => saveAdvancedSetting('securityAutoLockMinutes', e.target.value)}
            disabled={savingKey === 'securityAutoLockMinutes'}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
          >
            <option value="5">5 min</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="off">Desactivado</option>
          </select>
        </label>
      </section>

      <section className="glass-card rounded-xl p-4 md:p-5">
        <SecurityTab />
      </section>
    </div>
  )
}

export default Security
