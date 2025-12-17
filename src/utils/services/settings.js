/**
 * Gestor de configuraciones
 * Almacena configuraciones en memoria (puede extenderse para persistir)
 */
class SettingsManager {
  constructor() {
    this.settings = {}
  }

  /**
   * Establece un valor de configuración
   * @param {string} key - Clave de la configuración
   * @param {*} value - Valor a guardar
   */
  set(key, value) {
    this.settings[key] = value
    // Puede extenderse para guardar en localStorage
    try {
      const settingsJson = JSON.stringify(this.settings)
      localStorage.setItem('app_settings', settingsJson)
    } catch (error) {
      console.warn('No se pudo guardar en localStorage:', error)
    }
  }

  /**
   * Obtiene un valor de configuración
   * @param {string} key - Clave de la configuración
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {*} Valor de la configuración
   */
  get(key, defaultValue = null) {
    // Intentar cargar desde localStorage si no hay en memoria
    if (Object.keys(this.settings).length === 0) {
      try {
        const stored = localStorage.getItem('app_settings')
        if (stored) {
          this.settings = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('No se pudo cargar desde localStorage:', error)
      }
    }

    return this.settings[key] !== undefined ? this.settings[key] : defaultValue
  }

  /**
   * Obtiene todas las configuraciones
   * @returns {Object} Todas las configuraciones
   */
  getAll() {
    // Intentar cargar desde localStorage si no hay en memoria
    if (Object.keys(this.settings).length === 0) {
      try {
        const stored = localStorage.getItem('app_settings')
        if (stored) {
          this.settings = JSON.parse(stored)
        }
      } catch (error) {
        console.warn('No se pudo cargar desde localStorage:', error)
      }
    }

    return { ...this.settings }
  }

  /**
   * Elimina una configuración
   * @param {string} key - Clave a eliminar
   */
  remove(key) {
    delete this.settings[key]
    try {
      const settingsJson = JSON.stringify(this.settings)
      localStorage.setItem('app_settings', settingsJson)
    } catch (error) {
      console.warn('No se pudo guardar en localStorage:', error)
    }
  }

  /**
   * Limpia todas las configuraciones
   */
  clear() {
    this.settings = {}
    try {
      localStorage.removeItem('app_settings')
    } catch (error) {
      console.warn('No se pudo limpiar localStorage:', error)
    }
  }
}

// Crear instancia única (singleton)
const settingsManager = new SettingsManager()

export default settingsManager
