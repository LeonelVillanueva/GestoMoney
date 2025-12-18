import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../database/supabase'
import logger from '../utils/logger'

/**
 * Hook para manejar el PIN de seguridad para eliminaciones
 * El PIN se guarda hasheado en Supabase (tabla config)
 */
const useSecurityPin = () => {
  const [hasPin, setHasPin] = useState(false)
  const [loading, setLoading] = useState(true)

  /**
   * Genera un hash SHA-256 del PIN
   * @param {string} pin - PIN en texto plano
   * @returns {Promise<string>} - Hash en hexadecimal
   */
  const hashPin = async (pin) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(pin + '_gestor_gastos_salt_2025')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Verifica si existe un PIN configurado
   */
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
      // Validar que sea un PIN de 6 dígitos
      if (!/^\d{6}$/.test(pin)) {
        return { success: false, error: 'El PIN debe ser de 6 dígitos numéricos' }
      }

      const hashedPin = await hashPin(pin)

      const { error } = await supabase
        .from('config')
        .upsert({
          key: 'security_pin_hash',
          value: hashedPin,
          description: 'PIN de seguridad hasheado para eliminaciones'
        }, { onConflict: 'key' })

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
   * Verifica si el PIN ingresado es correcto
   * @param {string} pin - PIN a verificar
   * @returns {Promise<{valid: boolean, error?: string}>}
   */
  const verifyPin = async (pin) => {
    try {
      // Validar formato
      if (!/^\d{6}$/.test(pin)) {
        return { valid: false, error: 'PIN inválido' }
      }

      // Obtener el hash guardado
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'security_pin_hash')
        .single()

      if (error || !data?.value) {
        return { valid: false, error: 'No hay PIN configurado' }
      }

      // Comparar hashes
      const inputHash = await hashPin(pin)
      const isValid = inputHash === data.value

      if (!isValid) {
        logger.log('Intento de PIN incorrecto')
      }

      return { valid: isValid, error: isValid ? undefined : 'PIN incorrecto' }
    } catch (error) {
      logger.error('Error en verifyPin:', error)
      return { valid: false, error: 'Error al verificar el PIN' }
    }
  }

  /**
   * Cambia el PIN (requiere el PIN actual)
   * @param {string} currentPin - PIN actual
   * @param {string} newPin - Nuevo PIN
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const changePin = async (currentPin, newPin) => {
    try {
      // Verificar PIN actual
      const verification = await verifyPin(currentPin)
      if (!verification.valid) {
        return { success: false, error: 'PIN actual incorrecto' }
      }

      // Establecer nuevo PIN
      return await setPin(newPin)
    } catch (error) {
      logger.error('Error en changePin:', error)
      return { success: false, error: 'Error al cambiar el PIN' }
    }
  }

  /**
   * Elimina el PIN (requiere el PIN actual)
   * @param {string} currentPin - PIN actual para confirmar
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const removePin = async (currentPin) => {
    try {
      // Verificar PIN actual
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
