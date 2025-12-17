import { parseDateLocal, compareDates } from '../../../utils/normalizers'

/**
 * Calcula estadísticas de gastos
 */
export const calculateExpenseStatistics = (expenses, getCategoryColor) => {
  if (!expenses || expenses.length === 0) {
    return {
      totalAmount: 0,
      totalTransactions: 0,
      averageAmount: 0,
      categoryBreakdown: [],
      dailyBreakdown: [],
      topCategory: null,
      lowestCategory: null
    }
  }

  // Calcular totales
  const totalAmount = expenses.reduce((sum, expense) => sum + (parseFloat(expense.monto) || 0), 0)
  const totalTransactions = expenses.length
  const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0

  // Agrupar por categoría
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.categoria_nombre || 'Otros'
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, color: getCategoryColor(category) }
    }
    acc[category].total += parseFloat(expense.monto) || 0
    acc[category].count += 1
    return acc
  }, {})

  // Convertir a array y ordenar
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      color: data.color,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)

  // Encontrar categoría con más y menos gastos
  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null
  const lowestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[categoryBreakdown.length - 1] : null

  // Agrupar por día para gráfico de líneas
  const dailyTotals = expenses.reduce((acc, expense) => {
    const date = expense.fecha
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += parseFloat(expense.monto) || 0
    return acc
  }, {})

  const dailyBreakdown = Object.entries(dailyTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => {
      const dateA = parseDateLocal(a.date)
      const dateB = parseDateLocal(b.date)
      if (!dateA || !dateB) return 0
      const comparison = compareDates(dateA, dateB)
      return comparison !== null ? comparison : 0
    })

  return {
    totalAmount,
    totalTransactions,
    averageAmount,
    categoryBreakdown,
    dailyBreakdown,
    topCategory,
    lowestCategory
  }
}

/**
 * Calcula estadísticas de ingresos
 */
export const calculateIncomeStatistics = (incomes, getCategoryColor) => {
  if (!incomes || incomes.length === 0) {
    return {
      totalAmount: 0,
      totalTransactions: 0,
      averageAmount: 0,
      categoryBreakdown: [],
      dailyBreakdown: []
    }
  }

  // Calcular totales
  const totalAmount = incomes.reduce((sum, income) => sum + (parseFloat(income.monto) || 0), 0)
  const totalTransactions = incomes.length
  const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0

  // Agrupar por categoría
  const categoryTotals = incomes.reduce((acc, income) => {
    const category = income.categoria_nombre || 'Otros'
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, color: getCategoryColor(category) }
    }
    acc[category].total += parseFloat(income.monto) || 0
    acc[category].count += 1
    return acc
  }, {})

  // Convertir a array y ordenar
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
      color: data.color,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)

  // Agrupar por día
  const dailyTotals = incomes.reduce((acc, income) => {
    const date = income.fecha
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += parseFloat(income.monto) || 0
    return acc
  }, {})

  const dailyBreakdown = Object.entries(dailyTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => {
      const dateA = parseDateLocal(a.date)
      const dateB = parseDateLocal(b.date)
      if (!dateA || !dateB) return 0
      const comparison = compareDates(dateA, dateB)
      return comparison !== null ? comparison : 0
    })

  return {
    totalAmount,
    totalTransactions,
    averageAmount,
    categoryBreakdown,
    dailyBreakdown
  }
}
