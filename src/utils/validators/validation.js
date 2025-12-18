/**
 * Utilidades de validación y sanitización para seguridad
 */

/**
 * Sanitiza una cadena de texto para prevenir XSS
 * @param {string} str - Cadena a sanitizar
 * @returns {string} Cadena sanitizada
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') {
    return String(str)
  }
  
  // Escapar caracteres HTML peligrosos
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  return str.replace(/[&<>"'/]/g, (char) => map[char])
}

/**
 * Valida que un valor sea un número válido
 * @param {*} value - Valor a validar
 * @param {number} min - Valor mínimo (opcional)
 * @param {number} max - Valor máximo (opcional)
 * @returns {boolean} True si es válido
 */
export function isValidNumber(value, min = null, max = null) {
  const num = parseFloat(value)
  if (isNaN(num) || !isFinite(num)) {
    return false
  }
  if (min !== null && num < min) {
    return false
  }
  if (max !== null && num > max) {
    return false
  }
  return true
}

/**
 * Valida que una fecha sea válida
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} True si es válida
 */
export function isValidDate(date) {
  if (!date) return false
  const d = new Date(date)
  return d instanceof Date && !isNaN(d)
}

/**
 * Valida que una fecha esté en un rango válido
 * @param {string|Date} date - Fecha a validar
 * @param {Date} minDate - Fecha mínima (opcional)
 * @param {Date} maxDate - Fecha máxima (opcional)
 * @returns {boolean} True si está en el rango
 */
export function isDateInRange(date, minDate = null, maxDate = null) {
  if (!isValidDate(date)) return false
  const d = new Date(date)
  
  if (minDate && d < new Date(minDate)) {
    return false
  }
  if (maxDate && d > new Date(maxDate)) {
    return false
  }
  return true
}

/**
 * Valida que una cadena no esté vacía y tenga una longitud máxima
 * @param {string} str - Cadena a validar
 * @param {number} maxLength - Longitud máxima (opcional)
 * @returns {boolean} True si es válida
 */
export function isValidString(str, maxLength = null) {
  if (typeof str !== 'string') return false
  if (str.trim().length === 0) return false
  if (maxLength !== null && str.length > maxLength) return false
  return true
}

/**
 * Valida un ID (UUID o número)
 * @param {*} id - ID a validar
 * @returns {boolean} True si es válido
 */
export function isValidId(id) {
  if (!id) return false
  // UUID v4 pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  // Número entero positivo
  const numberPattern = /^\d+$/
  
  return uuidPattern.test(String(id)) || numberPattern.test(String(id))
}

/**
 * Valida datos de un gasto antes de guardarlo
 * @param {Object} expenseData - Datos del gasto
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateExpense(expenseData) {
  const errors = []
  
  if (!expenseData.fecha || !isValidDate(expenseData.fecha)) {
    errors.push('La fecha es requerida y debe ser válida')
  }
  
  if (expenseData.monto === undefined || expenseData.monto === null || !isValidNumber(expenseData.monto, 0)) {
    errors.push('El monto es requerido y debe ser un número positivo')
  }
  
  if (!expenseData.categoria_id || !isValidId(expenseData.categoria_id)) {
    errors.push('La categoría es requerida y debe ser válida')
  }
  
  if (expenseData.descripcion && !isValidString(expenseData.descripcion, 500)) {
    errors.push('La descripción no puede exceder 500 caracteres')
  }
  
  if (expenseData.moneda_original && !['LPS', 'USD'].includes(expenseData.moneda_original)) {
    errors.push('La moneda debe ser LPS o USD')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Valida datos de una categoría
 * @param {Object} categoryData - Datos de la categoría
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateCategory(categoryData) {
  const errors = []
  
  const name = categoryData.name || categoryData.nombre
  if (!name || !isValidString(name, 100)) {
    errors.push('El nombre de la categoría es requerido y no puede exceder 100 caracteres')
  }
  
  if (categoryData.color && !/^#[0-9A-F]{6}$/i.test(categoryData.color)) {
    errors.push('El color debe ser un código hexadecimal válido (ej: #3498db)')
  }
  
  if (categoryData.icon && !isValidString(categoryData.icon, 10)) {
    errors.push('El icono no puede exceder 10 caracteres')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitiza datos de un gasto antes de guardarlo
 * @param {Object} expenseData - Datos del gasto
 * @returns {Object} Datos sanitizados
 */
export function sanitizeExpense(expenseData) {
  return {
    fecha: expenseData.fecha,
    monto: parseFloat(expenseData.monto) || 0,
    categoria_id: expenseData.categoria_id,
    descripcion: expenseData.descripcion ? sanitizeString(expenseData.descripcion).substring(0, 500) : '',
    es_entrada: Boolean(expenseData.es_entrada),
    moneda_original: ['LPS', 'USD'].includes(expenseData.moneda_original) ? expenseData.moneda_original : 'LPS'
  }
}

/**
 * Sanitiza datos de una categoría
 * @param {Object} categoryData - Datos de la categoría
 * @returns {Object} Datos sanitizados
 */
export function sanitizeCategory(categoryData) {
  const name = categoryData.name || categoryData.nombre
  return {
    name: name ? sanitizeString(name).substring(0, 100) : '',
    color: categoryData.color && /^#[0-9A-F]{6}$/i.test(categoryData.color) ? categoryData.color : '#3498db',
    icon: categoryData.icon ? sanitizeString(categoryData.icon).substring(0, 10) : '💰',
    description: categoryData.description || categoryData.descripcion ? sanitizeString(categoryData.description || categoryData.descripcion).substring(0, 500) : ''
  }
}
 