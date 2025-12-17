/**
 * Convertidor de monedas
 * Maneja la conversión entre USD y LPS
 */

class CurrencyConverter {
  constructor() {
    this.exchangeRates = {
      'USD': {
        'LPS': 26.18 // Tasa por defecto
      }
    }
  }

  /**
   * Establece la tasa de cambio entre dos monedas
   * @param {string} from - Moneda origen (ej: 'USD')
   * @param {string} to - Moneda destino (ej: 'LPS')
   * @param {number} rate - Tasa de cambio
   */
  setExchangeRate(from, to, rate) {
    if (!this.exchangeRates[from]) {
      this.exchangeRates[from] = {}
    }
    this.exchangeRates[from][to] = parseFloat(rate)
  }

  /**
   * Obtiene la tasa de cambio entre dos monedas
   * @param {string} from - Moneda origen
   * @param {string} to - Moneda destino
   * @returns {number} Tasa de cambio
   */
  getExchangeRate(from, to) {
    return this.exchangeRates[from]?.[to] || 1
  }

  /**
   * Convierte un monto de una moneda a otra
   * @param {number} amount - Monto a convertir
   * @param {string} from - Moneda origen
   * @param {string} to - Moneda destino
   * @returns {number} Monto convertido
   */
  convert(amount, from, to) {
    if (from === to) return amount
    const rate = this.getExchangeRate(from, to)
    return parseFloat(amount) * rate
  }

  /**
   * Guarda las tasas de cambio (puede extenderse para persistir en localStorage)
   */
  saveExchangeRates() {
    // Por ahora solo guarda en memoria
    // Puede extenderse para guardar en localStorage o base de datos
    console.log('Tasas de cambio guardadas:', this.exchangeRates)
  }
}

// Crear instancia única (singleton)
const currencyConverter = new CurrencyConverter()

export default currencyConverter
