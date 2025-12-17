/**
 * Utilidad de logging que solo funciona en desarrollo
 * En producción, todos los logs se deshabilitan para evitar exponer información
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

/**
 * Logger seguro que solo funciona en desarrollo
 */
const logger = {
  /**
   * Log de información (solo en desarrollo)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * Log de errores (solo en desarrollo)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args)
    }
    // En producción, podrías enviar a un servicio de reporte de errores
    // if (!isDevelopment) {
    //   // Enviar a Sentry, LogRocket, etc.
    // }
  },

  /**
   * Log de advertencias (solo en desarrollo)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },

  /**
   * Log de información (solo en desarrollo)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
}

export default logger

