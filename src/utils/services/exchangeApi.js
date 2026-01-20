import database from '../../database/index.js'
import logger from '../logger.js'

/**
 * Servicio para obtener la tasa de cambio USD a HNL (Lempira Hondureño) desde exchangerate-api.com
 * Maneja cache, actualización automática y fallback a última tasa guardada
 */
class ExchangeApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_EXCHANGE_API_KEY || ''
    this.baseUrl = 'https://v6.exchangerate-api.com/v6'
    this.cacheKey = 'exchange_rate_cache'
    this.cacheDuration = 6 * 60 * 60 * 1000 // 6 horas en milisegundos
    this.updateInterval = null
  }

  /**
   * Obtiene la tasa de cambio USD a HNL desde la API
   * @returns {Promise<number|null>} Tasa de cambio o null si falla
   */
  async fetchExchangeRate() {
    if (!this.apiKey) {
      logger.warn('⚠️ EXCHANGE_API_KEY no configurada')
      return null
    }

    try {
      const url = `${this.baseUrl}/${this.apiKey}/pair/USD/HNL`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }

      const data = await response.json()

      if (data.result === 'success' && data.conversion_rate) {
        const rate = parseFloat(data.conversion_rate)
        
        // Guardar en cache
        this.saveToCache(rate)
        
        // Guardar en base de datos
        await this.saveToDatabase(rate)
        
        return rate
      } else {
        throw new Error('Invalid API response format')
      }
    } catch (error) {
      logger.error('❌ Error obteniendo tasa de cambio desde API:', error)
      return null
    }
  }

  /**
   * Guarda la tasa en localStorage con timestamp
   */
  saveToCache(rate) {
    const cacheData = {
      rate: rate,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(this.cacheKey, JSON.stringify(cacheData))
  }

  /**
   * Obtiene la tasa del cache si aún es válida
   */
  getFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return null

      const cacheData = JSON.parse(cached)
      const cacheTime = new Date(cacheData.timestamp).getTime()
      const now = Date.now()

      // Si el cache es más reciente que la duración configurada, usarlo
      if (now - cacheTime < this.cacheDuration) {
        return cacheData.rate
      }

      return null
    } catch (error) {
      logger.error('Error leyendo cache de tasa de cambio:', error)
      return null
    }
  }

  /**
   * Guarda la tasa en la base de datos
   */
  async saveToDatabase(rate) {
    try {
      await database.setConfig('tasa_cambio_usd', rate.toString())
      await database.setConfig('tasa_cambio_ultima_actualizacion', new Date().toISOString())
    } catch (error) {
      logger.error('Error guardando tasa en base de datos:', error)
    }
  }

  /**
   * Obtiene la última tasa guardada desde la base de datos
   */
  async getLastSavedRate() {
    try {
      const savedRate = await database.getConfig('tasa_cambio_usd')
      return savedRate ? parseFloat(savedRate) : null
    } catch (error) {
      logger.error('Error obteniendo última tasa guardada:', error)
      return null
    }
  }

  /**
   * Obtiene la tasa de cambio con fallback:
   * 1. Intenta desde cache (si es reciente)
   * 2. Intenta desde API
   * 3. Usa última tasa guardada en BD
   * 4. Usa tasa por defecto (26.18)
   */
  async getExchangeRate() {
    // 1. Intentar desde cache
    const cachedRate = this.getFromCache()
    if (cachedRate) {
      return cachedRate
    }

    // 2. Intentar desde API
    const apiRate = await this.fetchExchangeRate()
    if (apiRate) {
      return apiRate
    }

    // 3. Usar última tasa guardada en BD
    const savedRate = await this.getLastSavedRate()
    if (savedRate) {
      logger.warn('⚠️ Usando última tasa guardada debido a fallo de API')
      return savedRate
    }

    // 4. Tasa por defecto
    logger.warn('⚠️ Usando tasa por defecto (26.18)')
    return 26.18
  }

  /**
   * Obtiene la fecha de última actualización
   */
  async getLastUpdateDate() {
    try {
      const lastUpdate = await database.getConfig('tasa_cambio_ultima_actualizacion')
      return lastUpdate ? new Date(lastUpdate) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Inicia la actualización automática cada 6 horas
   */
  startAutoUpdate() {
    if (this.updateInterval) {
      return // Ya está corriendo
    }

    // Actualizar inmediatamente
    this.fetchExchangeRate()

    // Configurar actualización cada 6 horas
    const sixHours = 6 * 60 * 60 * 1000
    this.updateInterval = setInterval(() => {
      this.fetchExchangeRate()
    }, sixHours)
  }

  /**
   * Detiene la actualización automática
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * Fuerza una actualización manual
   */
  async forceUpdate() {
    return await this.fetchExchangeRate()
  }
}

// Exportar instancia única (Singleton)
const exchangeApiService = new ExchangeApiService()

export default exchangeApiService
