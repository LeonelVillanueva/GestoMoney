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
    this.serverNotConfiguredWarned = false
  }

  /**
   * Obtiene la tasa desde el proxy (sin API key en el cliente).
   */
  /**
   * @param {{ source?: 'auto' | 'manual' }} [opts] — origen mostrado en ajustes (tasa_cambio_actualizada_por)
   */
  async fetchExchangeRate(opts = {}) {
    const source = opts.source || 'auto'
    try {
      const response = await fetch('/api/exchange-rate', {
        credentials: 'same-origin'
      })

      if (response.status === 501) {
        if (!this.serverNotConfiguredWarned) {
          logger.warn('⚠️ Servicio de tasas no configurado en el servidor')
          this.serverNotConfiguredWarned = true
        }
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
        await this.saveToDatabase(rate, { source })
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

  /**
   * @param {{ source?: 'auto' | 'manual' }} [options]
   */
  async saveToDatabase(rate, options = {}) {
    const source = options.source || 'auto'
    const silent = { silentIfNoSession: true }
    try {
      const ok1 = await database.setConfig('tasa_cambio_usd', rate.toString(), '', silent)
      const ok2 = await database.setConfig(
        'tasa_cambio_ultima_actualizacion',
        new Date().toISOString(),
        '',
        silent
      )
      const ok3 = await database.setConfig('tasa_cambio_actualizada_por', source, '', silent)
      if (!ok1 || !ok2 || !ok3) {
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
    const meta = await this.getLastUpdateMeta()
    return meta.date
  }

  /**
   * @returns {Promise<{ date: Date | null, source: 'auto' | 'manual' | null }>}
   */
  async getLastUpdateMeta() {
    try {
      const [rawDate, src] = await Promise.all([
        database.getConfig('tasa_cambio_ultima_actualizacion'),
        database.getConfig('tasa_cambio_actualizada_por')
      ])
      const date = rawDate ? new Date(rawDate) : null
      const source = src === 'manual' || src === 'auto' ? src : null
      return { date, source }
    } catch (error) {
      return { date: null, source: null }
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
    return await this.fetchExchangeRate({ source: 'manual' })
  }
}

const exchangeApiService = new ExchangeApiService()

export default exchangeApiService
