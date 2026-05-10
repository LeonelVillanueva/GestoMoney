/**
 * Funciones auxiliares para ViewData
 */

function labelInitials(text) {
  const t = (text || '').trim()
  if (!t) return '?'
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return t.slice(0, 2).toUpperCase()
}

/**
 * @param {Object|string} expense - Gasto o nombre de categoría
 * @returns {string} Iniciales para mostrar en lista
 */
export const getCategoryIcon = (expense) => {
  const name =
    typeof expense === 'string' ? expense : expense?.categoria_nombre || expense?.categoria || ''
  return labelInitials(name)
}

/**
 * @param {string} supermercado
 * @returns {string} Iniciales
 */
export const getSupermarketIcon = (supermercado) => labelInitials(supermercado)

/**
 * @param {string} tipoCorte
 * @returns {string} Iniciales
 */
export const getCutIcon = (tipoCorte) => labelInitials(tipoCorte)

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
