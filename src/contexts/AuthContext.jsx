import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import logger from '../utils/logger'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [user, setUser] = useState(null)

  // Verificar sesión al cargar y escuchar cambios
  useEffect(() => {
    checkSession()

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true)
        setUser(session.user)
        logger.log('Usuario autenticado:', session.user.email)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        logger.log('Usuario desconectado')
      }
      setIsChecking(false)
    })

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Verifica si hay una sesión activa
   */
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        logger.error('Error verificando sesión:', error)
        setIsAuthenticated(false)
        setUser(null)
        return
      }

      if (session) {
        setIsAuthenticated(true)
        setUser(session.user)
        logger.log('Sesión activa encontrada:', session.user.email)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      logger.error('Error en checkSession:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsChecking(false)
    }
  }

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const login = async (email, password) => {
    try {
      logger.log('Intentando iniciar sesión con email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (error) {
        logger.error('Error en login:', error.message)
        return {
          success: false,
          error: error.message === 'Invalid login credentials' 
            ? 'Email o contraseña incorrectos'
            : error.message
        }
      }

      if (data.session) {
        setIsAuthenticated(true)
        setUser(data.user)
        logger.log('Login exitoso:', data.user.email)
        return { success: true }
      }

      return { success: false, error: 'No se pudo crear la sesión' }
    } catch (error) {
      logger.error('Error en login:', error)
      return {
        success: false,
        error: 'Error al iniciar sesión. Intenta nuevamente.'
      }
    }
  }

  /**
   * Cierra la sesión
   */
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('Error al cerrar sesión:', error)
        throw error
      }

      setIsAuthenticated(false)
      setUser(null)
      logger.log('Sesión cerrada correctamente')
    } catch (error) {
      logger.error('Error en logout:', error)
      throw error
    }
  }

  /**
   * Obtiene la sesión actual
   * @returns {Promise<Object|null>} - Sesión actual o null
   */
  const getSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      logger.error('Error obteniendo sesión:', error)
      return null
    }
  }

  /**
   * Cambia la contraseña del usuario
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const changePassword = async (newPassword) => {
    try {
      logger.log('Intentando cambiar contraseña')
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        logger.error('Error al cambiar contraseña:', error.message)
        
        // Traducir mensajes de error comunes
        let errorMessage = error.message
        if (error.message.includes('should be at least')) {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres'
        } else if (error.message.includes('same as')) {
          errorMessage = 'La nueva contraseña debe ser diferente a la actual'
        }
        
        return { success: false, error: errorMessage }
      }

      logger.log('Contraseña cambiada exitosamente')
      return { success: true }
    } catch (error) {
      logger.error('Error en changePassword:', error)
      return {
        success: false,
        error: 'Error al cambiar la contraseña. Intenta nuevamente.'
      }
    }
  }

  /**
   * Cambia el email del usuario
   * @param {string} newEmail - Nuevo email
   * @returns {Promise<{success: boolean, error?: string, needsConfirmation?: boolean}>}
   */
  const changeEmail = async (newEmail) => {
    try {
      logger.log('Intentando cambiar email a:', newEmail)
      
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail.trim().toLowerCase()
      })

      if (error) {
        logger.error('Error al cambiar email:', error.message)
        
        // Traducir mensajes de error comunes
        let errorMessage = error.message
        if (error.message.includes('already registered')) {
          errorMessage = 'Este email ya está registrado'
        } else if (error.message.includes('invalid')) {
          errorMessage = 'El email no es válido'
        }
        
        return { success: false, error: errorMessage }
      }

      logger.log('Solicitud de cambio de email enviada')
      
      // Supabase envía un email de confirmación al nuevo correo
      return { 
        success: true, 
        needsConfirmation: true,
        message: 'Se ha enviado un enlace de confirmación al nuevo email'
      }
    } catch (error) {
      logger.error('Error en changeEmail:', error)
      return {
        success: false,
        error: 'Error al cambiar el email. Intenta nuevamente.'
      }
    }
  }

  /**
   * Verifica la contraseña actual del usuario
   * @param {string} password - Contraseña a verificar
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const verifyPassword = async (password) => {
    try {
      if (!user?.email) {
        return { success: false, error: 'No hay sesión activa' }
      }

      // Re-autenticar con la contraseña actual
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password
      })

      if (error) {
        return { success: false, error: 'Contraseña incorrecta' }
      }

      return { success: true }
    } catch (error) {
      logger.error('Error verificando contraseña:', error)
      return { success: false, error: 'Error al verificar la contraseña' }
    }
  }

  const value = {
    isAuthenticated,
    isChecking,
    user,
    login,
    logout,
    getSession,
    changePassword,
    changeEmail,
    verifyPassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
