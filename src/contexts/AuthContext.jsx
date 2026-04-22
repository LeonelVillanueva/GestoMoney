import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../database/supabase'
import logger from '../utils/logger'

const LOGIN_GUARD_KEY = 'auth_login_guard_v1'
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 10 * 60 * 1000
const LOGIN_LOCK_MS = 15 * 60 * 1000
const LOGIN_MIN_DELAY_MS = 800
const USE_HTTPONLY_AUTH = import.meta.env.PROD || import.meta.env.VITE_USE_HTTPONLY_AUTH === 'true'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function readLoginGuard() {
  try {
    const raw = localStorage.getItem(LOGIN_GUARD_KEY)
    if (!raw) return { attempts: [], lockUntil: 0 }
    const parsed = JSON.parse(raw)
    return {
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      lockUntil: Number(parsed.lockUntil) || 0
    }
  } catch {
    return { attempts: [], lockUntil: 0 }
  }
}

function writeLoginGuard(guard) {
  try {
    localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify(guard))
  } catch {
    // Si el storage está bloqueado, evitamos romper el flujo de auth.
  }
}

function clearLoginGuard() {
  writeLoginGuard({ attempts: [], lockUntil: 0 })
}

function registerFailedAttempt() {
  const now = Date.now()
  const current = readLoginGuard()
  const attempts = [...current.attempts, now].filter((ts) => now - ts <= LOGIN_WINDOW_MS)
  const lockUntil = attempts.length >= LOGIN_MAX_ATTEMPTS ? now + LOGIN_LOCK_MS : 0
  const next = { attempts, lockUntil }
  writeLoginGuard(next)
  return next
}

function loginLockedMessage(lockUntil) {
  const ms = Math.max(0, lockUntil - Date.now())
  const minutes = Math.ceil(ms / 60000)
  return `Demasiados intentos. Espera ${minutes} min antes de volver a intentar.`
}

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

async function syncSupabaseSessionFromApiPayload(payload) {
  const accessToken = payload?.accessToken
  const refreshToken = payload?.refreshToken
  if (!accessToken || !refreshToken) return false
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  })
  return !error
}

/**
 * Mensaje seguro para la UI (sin detalles internos de Supabase).
 */
function userFacingLoginError(error) {
  const raw = (error && error.message) ? String(error.message) : ''
  const m = raw.toLowerCase()
  if (
    m.includes('invalid login credentials') ||
    m.includes('invalid_credentials') ||
    raw === 'Invalid login credentials'
  ) {
    return 'Email o contraseña incorrectos'
  }
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Debes confirmar tu correo antes de iniciar sesión'
  }
  if (m.includes('too many requests') || m.includes('rate limit') || m.includes('over_request_rate')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  }
  return 'No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.'
}

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
      } else {
        setIsAuthenticated(false)
        setUser(null)
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
      if (USE_HTTPONLY_AUTH) {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        const payload = await parseJsonSafe(response)

        if (!response.ok || !payload?.authenticated) {
          await supabase.auth.signOut()
          setIsAuthenticated(false)
          setUser(null)
          return
        }

        await syncSupabaseSessionFromApiPayload(payload)
        setIsAuthenticated(true)
        setUser(payload.user || null)
        return
      }

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
    const guard = readLoginGuard()
    if (guard.lockUntil > Date.now()) {
      return {
        success: false,
        error: loginLockedMessage(guard.lockUntil)
      }
    }

    try {
      // Añade latencia mínima para dificultar brute force desde el cliente.
      await sleep(LOGIN_MIN_DELAY_MS)

      if (USE_HTTPONLY_AUTH) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password
          })
        })

        const payload = await parseJsonSafe(response)
        if (!response.ok || !payload?.ok) {
          logger.warn('Intento de login rechazado por backend')
          const next = registerFailedAttempt()
          return {
            success: false,
            error:
              next.lockUntil > Date.now()
                ? loginLockedMessage(next.lockUntil)
                : (payload?.error || 'No se pudo iniciar sesión. Verifica tus datos e inténtalo de nuevo.')
          }
        }

        const synced = await syncSupabaseSessionFromApiPayload(payload)
        if (!synced) {
          logger.error('No se pudo sincronizar sesión local de Supabase tras login backend')
          return { success: false, error: 'No se pudo iniciar sesión. Intenta nuevamente.' }
        }

        clearLoginGuard()
        setIsAuthenticated(true)
        setUser(payload.user || null)
        return { success: true }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (error) {
        logger.error('Error en login:', error.message)
        const next = registerFailedAttempt()
        return {
          success: false,
          error:
            next.lockUntil > Date.now()
              ? loginLockedMessage(next.lockUntil)
              : userFacingLoginError(error)
        }
      }

      if (data.session) {
        clearLoginGuard()
        setIsAuthenticated(true)
        setUser(data.user)
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
      if (USE_HTTPONLY_AUTH) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('Error al cerrar sesión:', error)
        throw error
      }

      setIsAuthenticated(false)
      setUser(null)
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
      if (USE_HTTPONLY_AUTH) {
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        })
        const payload = await parseJsonSafe(response)
        if (!response.ok || !payload?.authenticated) return null
        await syncSupabaseSessionFromApiPayload(payload)
      }

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
        const msg = error.message || ''
        if (msg.includes('should be at least')) {
          return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' }
        }
        if (msg.includes('same as')) {
          return { success: false, error: 'La nueva contraseña debe ser diferente a la actual' }
        }
        return { success: false, error: 'No se pudo cambiar la contraseña. Intenta de nuevo.' }
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
        const msg = error.message || ''
        if (msg.includes('already registered')) {
          return { success: false, error: 'Este email ya está registrado' }
        }
        if (msg.toLowerCase().includes('invalid')) {
          return { success: false, error: 'El email no es válido' }
        }
        return { success: false, error: 'No se pudo cambiar el email. Intenta de nuevo.' }
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
