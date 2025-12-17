import { parseDateLocal, getTodayLocal, getDaysDifference } from '../../../utils/normalizers'

/**
 * Utilidades para cálculos de gráficos
 */

/**
 * Calcula totales por categoría
 */
export const calculateCategoryTotals = (gastos) => {
  const categoryTotals = {}
  
  gastos.forEach(expense => {
    if (expense.es_entrada === true || expense.es_entrada === 1) {
      return // Saltar ingresos
    }
    
    const category = expense.categoria_nombre || 'Otros'
    const amount = parseFloat(expense.monto)
    
    if (!isNaN(amount) && amount >= 0) {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount
    }
  })

  return categoryTotals
}

/**
 * Calcula datos mensuales para un año
 */
export const calculateMonthlyData = (gastos, year) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthlyTotals = Array.from({length: 12}, () => 0)
  
  gastos.forEach(expense => {
    if (expense.es_entrada === true || expense.es_entrada === 1) {
      return // Saltar ingresos
    }
    
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    const month = expenseDate.getMonth()
    const amount = parseFloat(expense.monto)
    
    if (expenseDate.getFullYear() === year && !isNaN(amount) && amount >= 0) {
      monthlyTotals[month] += amount
    }
  })

  return {
    labels: months,
    data: monthlyTotals.map(total => isNaN(total) ? 0 : total)
  }
}

/**
 * Calcula datos diarios para los últimos 30 días
 */
export const calculateDailyData = (gastos, ingresos) => {
  const today = getTodayLocal()
  const last30Days = Array.from({length: 30}, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (29 - i))
    return date.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' })
  })

  const dailyGastos = Array.from({length: 30}, () => 0)
  const dailyIngresos = Array.from({length: 30}, () => 0)
  
  // Calcular gastos por día
  gastos.forEach(expense => {
    if (expense.es_entrada === true || expense.es_entrada === 1) {
      return // Saltar ingresos
    }
    
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    const daysDiff = getDaysDifference(today, expenseDate)
    if (daysDiff === null) return
    
    const amount = parseFloat(expense.monto)
    
    if (daysDiff >= 0 && daysDiff < 30 && !isNaN(amount) && amount >= 0) {
      dailyGastos[29 - daysDiff] += amount
    }
  })

  // Calcular ingresos por día
  ingresos.forEach(expense => {
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    const daysDiff = getDaysDifference(today, expenseDate)
    if (daysDiff === null) return
    
    const amount = parseFloat(expense.monto)
    
    if (daysDiff >= 0 && daysDiff < 30 && !isNaN(amount) && amount >= 0) {
      dailyIngresos[29 - daysDiff] += amount
    }
  })

  // Calcular neto diario: gastos - ingresos
  const dailyTotals = dailyGastos.map((gastos, index) => {
    const ingresos = dailyIngresos[index] || 0
    return gastos - ingresos
  })

  return {
    labels: last30Days,
    data: dailyTotals.map(total => isNaN(total) ? 0 : total)
  }
}

/**
 * Calcula datos históricos completos por día (todos los días desde el primer gasto hasta el último)
 */
export const calculateHistoricalDailyData = (gastos, ingresos) => {
  if (!gastos || gastos.length === 0) {
    return { labels: [], data: [] }
  }

  // Encontrar el rango de fechas
  let minDate = null
  let maxDate = null

  gastos.forEach(expense => {
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    if (!minDate || expenseDate < minDate) {
      minDate = new Date(expenseDate)
    }
    if (!maxDate || expenseDate > maxDate) {
      maxDate = new Date(expenseDate)
    }
  })

  ingresos.forEach(expense => {
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    if (!minDate || expenseDate < minDate) {
      minDate = new Date(expenseDate)
    }
    if (!maxDate || expenseDate > maxDate) {
      maxDate = new Date(expenseDate)
    }
  })

  if (!minDate || !maxDate) {
    return { labels: [], data: [] }
  }

  // Generar todos los días entre minDate y maxDate
  const dailyData = new Map()
  const currentDate = new Date(minDate)
  currentDate.setHours(0, 0, 0, 0) // Inicio del día

  while (currentDate <= maxDate) {
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    dailyData.set(dateKey, { gastos: 0, ingresos: 0 })
    
    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Calcular gastos por día
  gastos.forEach(expense => {
    if (expense.es_entrada === true || expense.es_entrada === 1) {
      return // Saltar ingresos
    }
    
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    expenseDate.setHours(0, 0, 0, 0)
    const dateKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`
    const amount = parseFloat(expense.monto)
    
    if (dailyData.has(dateKey) && !isNaN(amount) && amount >= 0) {
      dailyData.get(dateKey).gastos += amount
    }
  })

  // Calcular ingresos por día
  ingresos.forEach(expense => {
    const expenseDate = parseDateLocal(expense.fecha)
    if (!expenseDate) return
    
    expenseDate.setHours(0, 0, 0, 0)
    const dateKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`
    const amount = parseFloat(expense.monto)
    
    if (dailyData.has(dateKey) && !isNaN(amount) && amount >= 0) {
      dailyData.get(dateKey).ingresos += amount
    }
  })

  // Convertir a arrays ordenados
  const sortedKeys = Array.from(dailyData.keys()).sort()
  const labels = sortedKeys.map(key => {
    const [year, month, day] = key.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return date.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' })
  })
  
  const data = sortedKeys.map(key => {
    const dayData = dailyData.get(key)
    return dayData.gastos - dayData.ingresos // Neto diario
  })

  return { labels, data }
}
