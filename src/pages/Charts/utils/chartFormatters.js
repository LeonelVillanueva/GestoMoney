/**
 * Utilidades para formatear datos de gráficos
 */

/**
 * Formatea un monto a moneda
 */
export const formatCurrency = (amount) => {
  let numAmount = 0
  
  if (typeof amount === 'number') {
    numAmount = amount
  } else if (typeof amount === 'string') {
    numAmount = parseFloat(amount)
  } else if (typeof amount === 'object' && amount !== null) {
    numAmount = amount.y || amount.value || amount.amount || 0
  } else {
    numAmount = parseFloat(amount)
  }
  
  if (isNaN(numAmount)) {
    return 'L0'
  }
  
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 0
  }).format(numAmount)
}

/**
 * Colores para gráficos
 */
export const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', 
  '#ec4899', '#6366f1'
]
