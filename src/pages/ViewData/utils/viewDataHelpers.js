/**
 * Funciones auxiliares para ViewData
 */

/**
 * Obtiene el ícono de una categoría
 * @param {Object|string} expense - Objeto de gasto o nombre de categoría
 * @returns {string} Emoji del ícono
 */
export const getCategoryIcon = (expense) => {
  // Si el expense tiene categoria_icon, usarlo directamente
  if (expense && expense.categoria_icon) {
    return expense.categoria_icon
  }
  // Si solo se pasa el nombre de la categoría (backward compatibility)
  if (typeof expense === 'string') {
    const icons = {
      'Comida': '🍽️',
      'Transporte': '🚌',
      'Entretenimiento': '🎮',
      'Regalos': '🎁',
      'Utilidades': '⚡',
      'Salud': '🏥',
      'Educación': '📚',
      'Tecnología': '💻',
      'Otros': '📦'
    }
    return icons[expense] || '📦'
  }
  // Fallback
  return '📦'
}

/**
 * Obtiene el ícono de un supermercado
 * @param {string} supermercado - Nombre del supermercado
 * @returns {string} Emoji del ícono
 */
export const getSupermarketIcon = (supermercado) => {
  return supermercado === 'La Colonia' ? '🏪' : '🏬'
}

/**
 * Obtiene el ícono de un tipo de corte
 * @param {string} tipoCorte - Tipo de corte
 * @returns {string} Emoji del ícono
 */
export const getCutIcon = (tipoCorte) => {
  const icons = {
    'Corte básico': '💇',
    'Corte y peinado': '💇‍♂️',
    'Corte + barba': '🧔',
    'Corte + tinte': '🎨',
    'Corte + mechas': '🌈',
    'Tratamiento capilar': '💆',
    'Otros': '✂️'
  }
  return icons[tipoCorte] || '💇'
}

/**
 * Descarga un archivo CSV
 * @param {string} csvContent - Contenido CSV
 * @param {string} filename - Nombre del archivo
 */
export const downloadCSVFile = (csvContent, filename) => {
  if (!csvContent) {
    return false
  }

  // Crear y descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  return true
}
