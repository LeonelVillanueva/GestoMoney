/**
 * Utilidades de formateo para ViewData
 */

/**
 * Formatea un monto como moneda en formato hondureño (LPS)
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado como moneda
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Formatea una fecha en formato legible
 * @param {string} dateString - Fecha en formato YYYY-MM-DD o ISO
 * @returns {string} Fecha formateada
 */
export const formatDate = (dateString) => {
  // Parsear fecha de manera segura para evitar problemas de zona horaria
  if (!dateString) return ''
  
  // Si es formato YYYY-MM-DD, parsear directamente
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Para otros formatos, usar parsing normal
  return new Date(dateString).toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Convierte datos a formato CSV
 * @param {Array} data - Array de datos a convertir
 * @param {string} type - Tipo de datos ('gastos', 'supermercado', 'cortes')
 * @returns {string} Contenido CSV
 */
export const convertToCSV = (data, type) => {
  if (!data || data.length === 0) return ''

  let headers = []
  let rows = []

  switch (type) {
    case 'gastos':
      headers = ['Fecha', 'Monto (LPS)', 'Categoría', 'Descripción', 'Tipo', 'Moneda Original']
      rows = data.map(expense => [
        expense.fecha,
        expense.monto,
        expense.categoria_nombre || 'Sin categoría',
        expense.descripcion || '',
        expense.es_entrada ? 'Ingreso' : 'Gasto',
        expense.moneda_original || 'LPS'
      ])
      break
    
    case 'supermercado':
      headers = ['Fecha', 'Monto (LPS)', 'Supermercado', 'Descripción']
      rows = data.map(purchase => [
        purchase.fecha,
        purchase.monto,
        purchase.supermercado || '',
        purchase.descripcion || ''
      ])
      break
    
    case 'cortes':
      headers = ['Fecha', 'Tipo de Corte', 'Descripción']
      rows = data.map(cut => [
        cut.fecha,
        cut.tipo_corte || '',
        cut.descripcion || ''
      ])
      break
  }

  // Crear CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ].join('\n')

  return csvContent
}
