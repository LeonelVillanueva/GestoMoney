import { useState, useCallback } from 'react'
import { parseDateLocal, compareDates, isDateInRange } from '../../../utils/normalizers'
import { calculateExpenseStatistics, calculateIncomeStatistics } from '../utils/calculationHelpers'
import { getCategoryColor } from '../utils/expenseFormatters'

/**
 * Hook para calcular estadísticas de gastos e ingresos
 */
export const useExpenseCalculation = (expenses) => {
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [filteredIncomes, setFilteredIncomes] = useState([])
  const [calculations, setCalculations] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    averageAmount: 0,
    categoryBreakdown: [],
    dailyBreakdown: [],
    topCategory: null,
    lowestCategory: null
  })
  const [incomeCalculations, setIncomeCalculations] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    averageAmount: 0,
    categoryBreakdown: [],
    dailyBreakdown: []
  })
  const [isCalculated, setIsCalculated] = useState(false)

  const calculate = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) {
      return false
    }

    const start = parseDateLocal(startDate)
    const end = parseDateLocal(endDate)
    
    if (!start || !end) {
      return false
    }

    if (compareDates(start, end) === 1) {
      return false
    }

    // Filtrar gastos e ingresos por rango de fechas
    const filtered = expenses.filter(expense => {
      if (!expense.fecha) return false
      
      const expenseDate = parseDateLocal(expense.fecha)
      if (!expenseDate) return false
      
      return isDateInRange(expenseDate, startDate, endDate)
    })

    // Separar gastos (es_entrada = false) de ingresos (es_entrada = true)
    const gastos = filtered.filter(expense => !expense.es_entrada)
    const ingresos = filtered.filter(expense => expense.es_entrada)

    setFilteredExpenses(gastos)
    setFilteredIncomes(ingresos)
    
    // Calcular estadísticas
    const expenseStats = calculateExpenseStatistics(gastos, getCategoryColor)
    const incomeStats = calculateIncomeStatistics(ingresos, getCategoryColor)
    
    setCalculations(expenseStats)
    setIncomeCalculations(incomeStats)
    setIsCalculated(true)
    
    return true
  }, [expenses])

  return {
    filteredExpenses,
    filteredIncomes,
    calculations,
    incomeCalculations,
    isCalculated,
    calculate
  }
}
