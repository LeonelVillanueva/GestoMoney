/**
 * Utilidades para formateo de presupuestos
 */

/**
 * Formatea moneda
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Formatea fecha (mes)
 */
export const formatDate = (dateString) => {
  const [year, month] = dateString.split('-')
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('es-HN', { 
    year: 'numeric', 
    month: 'long' 
  })
}

/**
 * Categorías disponibles
 */
export const CATEGORIES = [
  { id: 'Comida', name: 'Comida', icon: '🍽️', color: '#ff6b6b' },
  { id: 'Transporte', name: 'Transporte', icon: '🚌', color: '#4ecdc4' },
  { id: 'Entretenimiento', name: 'Entretenimiento', icon: '🎮', color: '#45b7d1' },
  { id: 'Regalos', name: 'Regalos', icon: '🎁', color: '#96ceb4' },
  { id: 'Utilidades', name: 'Utilidades', icon: '⚡', color: '#feca57' },
  { id: 'Salud', name: 'Salud', icon: '🏥', color: '#ff9ff3' },
  { id: 'Educación', name: 'Educación', icon: '📚', color: '#54a0ff' },
  { id: 'Tecnología', name: 'Tecnología', icon: '💻', color: '#5f27cd' },
  { id: 'Otros', name: 'Otros', icon: '📦', color: '#a55eea' }
]
