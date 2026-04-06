import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../database/supabase'
import logger from '../utils/logger'
import { hashSecurityPin, SECURITY_PIN_SALT_SUFFIX } from '../utils/pinHash'

export { SECURITY_PIN_SALT_SUFFIX }

/**
 * Hook para manejar el PIN de seguridad para eliminaciones
 * El PIN se guarda hasheado en Supabase (tabla config).
 * La verificación usa RPC verify_security_pin (límite de intentos en servidor).
 */
const useSecurityPin = () => {
  const [hasPin, setHasPin] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkPinExists = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'security_pin_hash')
        .single()

      if (error && error.code !== 'PGRST116') {
        logger.error('Error verificando PIN:', error)
        setHasPin(false)
        return false
      }

      const exists = !!data?.value
      setHasPin(exists)
      return exists
    } catch (error) {
      logger.error('Error en checkPinExists:', error)
      setHasPin(false)
      return false
    } finally {
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'No hay sesión' }
      }

      const hashedPin = await hashSecurityPin(pin)

      const { error } = await supabase
        .from('config')
        .upsert({
          user_id: user.id,
          key: 'security_pin_hash',
          value: hashedPin,
          description: 'PIN de seguridad hasheado para eliminaciones'
        }, { onConflict: 'user_id,key' })

      if (error) {
        logger.error('Error guardando PIN:', error)
        return { success: false, error: 'Error al guardar el PIN' }
      }

      setHasPin(true)
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

      const { data, error } = await supabase.rpc('verify_security_pin', { p_pin: pin })

      if (error) {
        logger.error('Error en verify_security_pin:', error)
        return { valid: false, error: 'Error al verificar el PIN' }
      }

      const valid = data?.valid === true
      let errMsg = data?.error

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
      const verification = await verifyPin(currentPin)
      if (!verification.valid) {
        return { success: false, error: 'PIN actual incorrecto' }
      }

      return await setPin(newPin)
    } catch (error) {
      logger.error('Error en changePin:', error)
      return { success: false, error: 'Error al cambiar el PIN' }
    }
  }

  const removePin = async (currentPin) => {
    try {
      const verification = await verifyPin(currentPin)
      if (!verification.valid) {
        return { success: false, error: 'PIN incorrecto' }
      }

      const { error } = await supabase
        .from('config')
        .delete()
        .eq('key', 'security_pin_hash')

      if (error) {
        logger.error('Error eliminando PIN:', error)
        return { success: false, error: 'Error al eliminar el PIN' }
      }

      setHasPin(false)
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
