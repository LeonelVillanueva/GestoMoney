import database from '../../database/index.js'
import logger from '../logger.js'

/**
 * Tasa USD → HNL vía proxy /api/exchange-rate (clave solo en servidor: EXCHANGE_API_KEY).
 * En desarrollo/preview el proxy lo añade Vite; en Vercel, api/exchange-rate.js.
 */
class ExchangeApiService {
  constructor() {
    this.cacheKey = 'exchange_rate_cache'
    this.cacheDuration = 6 * 60 * 60 * 1000 // 6 horas
    this.updateInterval = null
  }

  /**
   * Obtiene la tasa desde el proxy (sin API key en el cliente).
   */
  async fetchExchangeRate() {
    try {
      const response = await fetch('/api/exchange-rate')

      if (response.status === 501) {
        logger.warn('⚠️ EXCHANGE_API_KEY no configurada en el servidor')
        return null
      }

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }

      const data = await response.json()

      if (data.error && !data.conversion_rate) {
        return null
      }

      if (data.result === 'success' && data.conversion_rate) {
        const rate = parseFloat(data.conversion_rate)
        this.saveToCache(rate)
        await this.saveToDatabase(rate)
        return rate
      }

      throw new Error('Invalid API response format')
    } catch (error) {
      logger.error('❌ Error obteniendo tasa de cambio desde API:', error)
      return null
    }
  }

  saveToCache(rate) {
    const cacheData = {
      rate,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(this.cacheKey, JSON.stringify(cacheData))
  }

  getFromCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (!cached) return null

      const cacheData = JSON.parse(cached)
      const cacheTime = new Date(cacheData.timestamp).getTime()
      const now = Date.now()

      if (now - cacheTime < this.cacheDuration) {
        return cacheData.rate
      }

      return null
    } catch (error) {
      logger.error('Error leyendo cache de tasa de cambio:', error)
      return null
    }
  }

  async saveToDatabase(rate) {
    const silent = { silentIfNoSession: true }
    try {
      const ok1 = await database.setConfig('tasa_cambio_usd', rate.toString(), '', silent)
      const ok2 = await database.setConfig(
        'tasa_cambio_ultima_actualizacion',
        new Date().toISOString(),
        '',
        silent
      )
      if (!ok1 || !ok2) {
        logger.debug('Tasa no guardada en config (sesión aún no lista); queda en cache local.')
      }
    } catch (error) {
      logger.error('Error guardando tasa en base de datos:', error)
    }
  }

  async getLastSavedRate() {
    try {
      const savedRate = await database.getConfig('tasa_cambio_usd')
      return savedRate ? parseFloat(savedRate) : null
    } catch (error) {
      logger.error('Error obteniendo última tasa guardada:', error)
      return null
    }
  }

  async getExchangeRate() {
    const cachedRate = this.getFromCache()
    if (cachedRate) {
      return cachedRate
    }

    const apiRate = await this.fetchExchangeRate()
    if (apiRate) {
      return apiRate
    }

    const savedRate = await this.getLastSavedRate()
    if (savedRate) {
      logger.warn('⚠️ Usando última tasa guardada debido a fallo de API')
      return savedRate
    }

    logger.warn('⚠️ Usando tasa por defecto (26.18)')
    return 26.18
  }

  async getLastUpdateDate() {
    try {
      const lastUpdate = await database.getConfig('tasa_cambio_ultima_actualizacion')
      return lastUpdate ? new Date(lastUpdate) : null
    } catch (error) {
      return null
    }
  }

  startAutoUpdate() {
    if (this.updateInterval) {
      return
    }

    this.fetchExchangeRate()

    const sixHours = 6 * 60 * 60 * 1000
    this.updateInterval = setInterval(() => {
      this.fetchExchangeRate()
    }, sixHours)
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  async forceUpdate() {
    return await this.fetchExchangeRate()
  }
}

const exchangeApiService = new ExchangeApiService()

export default exchangeApiService
