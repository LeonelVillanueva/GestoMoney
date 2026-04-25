import { useState, useEffect, useCallback } from 'react'
import logger from '../utils/logger'
import { SECURITY_PIN_SALT_SUFFIX } from '../utils/pinHash'

export { SECURITY_PIN_SALT_SUFFIX }

const PIN_STATUS_CACHE_TTL_MS = 10_000
const pinStatusCache = {
  hasPin: null,
  fetchedAt: 0,
  pending: null
}

/**
 * Hook para manejar el PIN de seguridad para eliminaciones
 * El PIN se guarda hasheado en Supabase (tabla config).
 * La verificación usa RPC verify_security_pin (límite de intentos en servidor).
 */
const useSecurityPin = () => {
  const [hasPin, setHasPin] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkPinExists = useCallback(async (force = false) => {
    const now = Date.now()
    const hasFreshCache =
      !force &&
      pinStatusCache.hasPin !== null &&
      now - pinStatusCache.fetchedAt < PIN_STATUS_CACHE_TTL_MS

    if (hasFreshCache) {
      const cached = Boolean(pinStatusCache.hasPin)
      setHasPin(cached)
      setLoading(false)
      return cached
    }

    if (pinStatusCache.pending) {
      setLoading(true)
      try {
        const exists = await pinStatusCache.pending
        setHasPin(Boolean(exists))
        return Boolean(exists)
      } finally {
        setLoading(false)
      }
    }

    try {
      setLoading(true)
      pinStatusCache.pending = (async () => {
        const response = await fetch('/api/security/pin/status', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || 'Respuesta inválida')
        }
        return Boolean(payload?.hasPin)
      })()

      const exists = await pinStatusCache.pending
      pinStatusCache.hasPin = exists
      pinStatusCache.fetchedAt = Date.now()
      setHasPin(Boolean(exists))
      return exists
    } catch (error) {
      logger.error('Error en checkPinExists:', error)
      pinStatusCache.hasPin = false
      pinStatusCache.fetchedAt = Date.now()
      setHasPin(false)
      return false
    } finally {
      pinStatusCache.pending = null
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkPinExists()
  }, [checkPinExists])

  /**
   * Configura un nuevo PIN
   * @param {string} pin - PIN de 6 dígitos
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const setPin = async (pin) => {
    try {
      if (!/^\d{6}$/.test(pin)) {
        return { success: false, error: 'El PIN debe ser de 6 dígitos numéricos' }
      }

      const response = await fetch('/api/security/pin/set', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        return { success: false, error: payload?.error || 'Error al guardar el PIN' }
      }

      setHasPin(true)
      pinStatusCache.hasPin = true
      pinStatusCache.fetchedAt = Date.now()
      logger.log('PIN de seguridad configurado correctamente')
      return { success: true }
    } catch (error) {
      logger.error('Error en setPin:', error)
      return { success: false, error: 'Error inesperado al configurar el PIN' }
    }
  }

  /**
   * Verifica el PIN vía RPC (contador de fallos y bloqueo en base de datos).
   */
  const verifyPin = async (pin) => {
    try {
      if (!/^\d{6}$/.test(pin)) {
        return { valid: false, error: 'PIN inválido' }
      }

      const response = await fetch('/api/security/pin/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        logger.error('Error en verify PIN:', payload?.error || 'Respuesta inválida')
        return { valid: false, error: payload?.error || 'Error al verificar el PIN' }
      }

      const valid = payload?.valid === true
      let errMsg = payload?.error

      if (!valid && errMsg) {
        logger.log('Verificación PIN:', errMsg)
      }

      // Tras migración RLS: fila security_pin_hash con user_id NULL o ajeno → RPC no encuentra hash
      if (!valid && errMsg === 'No hay PIN configurado') {
        errMsg =
          'El PIN no está vinculado a tu usuario (suele pasar tras migrar la base). ' +
          'En Supabase ejecuta el script supabase/fix_pin_user_id.sql o borra la fila en config y define un PIN nuevo en Ajustes → Seguridad.'
      }

      return { valid, error: valid ? undefined : errMsg }
    } catch (error) {
      logger.error('Error en verifyPin:', error)
      return { valid: false, error: 'Error al verificar el PIN' }
    }
  }

  const changePin = async (currentPin, newPin) => {
    try {
      const response = await fetch('/api/security/pin/change', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        return { success: false, error: payload?.error || 'Error al cambiar el PIN' }
      }
      return { success: true }
    } catch (error) {
      logger.error('Error en changePin:', error)
      return { success: false, error: 'Error al cambiar el PIN' }
    }
  }

  const removePin = async (currentPin) => {
    try {
      const response = await fetch('/api/security/pin/remove', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: currentPin })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        logger.error('Error eliminando PIN:', payload?.error || 'Respuesta inválida')
        return { success: false, error: payload?.error || 'Error al eliminar el PIN' }
      }

      setHasPin(false)
      pinStatusCache.hasPin = false
      pinStatusCache.fetchedAt = Date.now()
      logger.log('PIN de seguridad eliminado')
      return { success: true }
    } catch (error) {
      logger.error('Error en removePin:', error)
      return { success: false, error: 'Error al eliminar el PIN' }
    }
  }

  return {
    hasPin,
    loading,
    setPin,
    verifyPin,
    changePin,
    removePin,
    checkPinExists
  }
}

export default useSecurityPin
