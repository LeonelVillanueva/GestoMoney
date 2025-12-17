/**
 * Utilidades de normalización de datos y fechas
 * Maneja la normalización de fechas sin problemas de zona horaria
 */

/**
 * Parsea una fecha string a Date object sin problemas de zona horaria
 * @param {string} dateString - Fecha en formato YYYY-MM-DD o ISO
 * @returns {Date|null} Objeto Date o null si no es válido
 */
export const parseDateLocal = (dateString) => {
  if (!dateString) return null
  
  try {
    // Si es formato YYYY-MM-DD, parsear directamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
    }
    
    // Para otros formatos, intentar parsing normal
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    // Crear fecha local sin problemas de zona horaria
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
  } catch (error) {
    console.warn('Error parsing date:', dateString, error)
    return null
  }
}

/**
 * Obtiene la fecha de hoy como Date object local
 * @returns {Date} Fecha de hoy
 */
export const getTodayLocal = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)
}

/**
 * Formatea un Date object a string YYYY-MM-DD
 * @param {Date} date - Objeto Date a formatear
 * @returns {string} Fecha formateada como YYYY-MM-DD
 */
export const formatDateLocal = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Calcula la diferencia de días entre dos fechas
 * @param {Date} date1 - Fecha de referencia (generalmente hoy)
 * @param {Date} date2 - Fecha a comparar
 * @returns {number|null} Diferencia de días (positivo si date2 es anterior, negativo si es posterior) o null si hay error
 */
export const getDaysDifference = (date1, date2) => {
  if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) {
    return null
  }
  
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return null
  }
  
  // Normalizar ambas fechas a medianoche local
  const normalized1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const normalized2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  
  // Calcular diferencia en milisegundos y convertir a días
  const diffMs = normalized1.getTime() - normalized2.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Compara dos fechas solo por año, mes y día (ignora hora)
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {number|null} -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2, null si hay error
 */
export const compareDates = (date1, date2) => {
  if (!date1 || !date2 || !(date1 instanceof Date) || !(date2 instanceof Date)) {
    return null
  }
  
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return null
  }
  
  // Comparar solo año, mes y día
  const year1 = date1.getFullYear()
  const month1 = date1.getMonth()
  const day1 = date1.getDate()
  
  const year2 = date2.getFullYear()
  const month2 = date2.getMonth()
  const day2 = date2.getDate()
  
  if (year1 < year2) return -1
  if (year1 > year2) return 1
  
  if (month1 < month2) return -1
  if (month1 > month2) return 1
  
  if (day1 < day2) return -1
  if (day1 > day2) return 1
  
  return 0
}

/**
 * Verifica si una fecha está dentro de un rango (inclusive)
 * @param {Date} date - Fecha a verificar
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {boolean} true si la fecha está en el rango
 */
export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false
  }
  
  const start = parseDateLocal(startDate)
  const end = parseDateLocal(endDate)
  
  if (!start || !end) {
    return false
  }
  
  const comparisonStart = compareDates(date, start)
  const comparisonEnd = compareDates(date, end)
  
  // La fecha debe ser >= start y <= end
  return (comparisonStart === 0 || comparisonStart === 1) && 
         (comparisonEnd === 0 || comparisonEnd === -1)
}

/**
 * Normaliza un array de datos usando una función normalizadora
 * @param {Array} data - Array de datos a normalizar
 * @param {Function} normalizer - Función normalizadora
 * @returns {Array} Array normalizado
 */
export const normalizeMany = (data, normalizer) => {
  if (!Array.isArray(data)) return []
  if (typeof normalizer !== 'function') return data
  
  return data.map(item => normalizer(item)).filter(item => item !== null && item !== undefined)
}

/**
 * Normaliza un gasto individual
 * @param {Object} expense - Gasto a normalizar
 * @returns {Object} Gasto normalizado
 */
export const normalizeExpense = (expense) => {
  if (!expense || typeof expense !== 'object') return null
  
  return {
    id: expense.id,
    fecha: expense.fecha || '',
    monto: parseFloat(expense.monto) || 0,
    categoria_id: expense.categoria_id,
    categoria_nombre: expense.categoria_nombre || 'Otros',
    categoria_icon: expense.categoria_icon || '📦',
    categoria_color: expense.categoria_color || '#a55eea',
    descripcion: expense.descripcion || '',
    es_entrada: expense.es_entrada === true || expense.es_entrada === 1 || expense.es_entrada === 'true' || expense.es_entrada === '1',
    moneda_original: expense.moneda_original || 'LPS',
    created_at: expense.created_at
  }
}

/**
 * Normaliza una compra de supermercado
 * @param {Object} purchase - Compra a normalizar
 * @returns {Object} Compra normalizada
 */
export const normalizeSupermarketPurchase = (purchase) => {
  if (!purchase || typeof purchase !== 'object') return null
  
  return {
    id: purchase.id,
    fecha: purchase.fecha || '',
    monto: parseFloat(purchase.monto) || 0,
    supermercado: purchase.supermercado || '',
    descripcion: purchase.descripcion || '',
    created_at: purchase.created_at
  }
}

/**
 * Normaliza un corte
 * @param {Object} cut - Corte a normalizar
 * @returns {Object} Corte normalizado
 */
export const normalizeCut = (cut) => {
  if (!cut || typeof cut !== 'object') return null
  
  return {
    id: cut.id,
    fecha: cut.fecha || '',
    tipo_corte: cut.tipo_corte || '',
    descripcion: cut.descripcion || '',
    created_at: cut.created_at
  }
}
