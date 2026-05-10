import { parseDateLocal } from '../../../utils/normalizers'

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
 * Formatea fecha
 */
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = parseDateLocal(dateString)
  if (!date) return dateString
  return date.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Obtiene color de categoría
 */
export const getCategoryColor = (category) => {
  const colors = {
    'Comida': '#ff6b6b',
    'Transporte': '#4ecdc4',
    'Entretenimiento': '#45b7d1',
    'Regalos': '#96ceb4',
    'Utilidades': '#feca57',
    'Salud': '#ff9ff3',
    'Educación': '#54a0ff',
    'Tecnología': '#5f27cd',
    'Otros': '#a55eea'
  }
  return colors[category] || '#a55eea'
}

function categoryInitials(category) {
  const c = (category || '').trim()
  if (!c) return '?'
  const parts = c.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return c.slice(0, 2).toUpperCase()
}

/** Iniciales de categoría para listas y tarjetas */
export const getCategoryIcon = (category) => categoryInitials(category)
