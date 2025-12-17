import { useState, useCallback, useMemo } from 'react'
import { parseDateLocal, getTodayLocal, getDaysDifference, compareDates, isDateInRange } from '../../../utils/normalizers'

/**
 * Hook para manejar filtros de gráficos
 */
export const useChartFilters = (expenses) => {
  const [filters, setFilters] = useState({
    period: 'all', // 'all', 'week', 'month', 'quarter', 'year', 'custom'
    category: 'all', // 'all' or specific category
    currency: 'all', // 'all', 'LPS', 'USD'
    year: new Date().getFullYear(), // Año para análisis trimestral
    month: '', // Mes específico (YYYY-MM)
    customStartDate: '', // Fecha de inicio personalizada
    customEndDate: '' // Fecha de fin personalizada
  })

  // Filtrar gastos según los filtros aplicados
  const filteredExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return []
    
    let result = [...expenses]
    
    // Filtro por período
    if (filters.period !== 'all') {
      const today = getTodayLocal()
      result = result.filter(expense => {
        const expenseDate = parseDateLocal(expense.fecha)
        if (!expenseDate) return false
        
        const expenseYear = expenseDate.getFullYear()
        const expenseMonth = expenseDate.getMonth()
        
        switch (filters.period) {
          case 'week':
            const daysDiff = getDaysDifference(today, expenseDate)
            return daysDiff !== null && daysDiff >= 0 && daysDiff <= 7
          case 'month':
            const daysDiffMonth = getDaysDifference(today, expenseDate)
            return daysDiffMonth !== null && daysDiffMonth >= 0 && daysDiffMonth <= 30
          case 'quarter':
            return expenseYear === filters.year
          case 'year':
            return expenseYear === filters.year
          case 'specific_month':
            if (filters.month) {
              const selectedYear = parseInt(filters.month.split('-')[0])
              const selectedMonth = parseInt(filters.month.split('-')[1]) - 1
              return expenseYear === selectedYear && expenseMonth === selectedMonth
            }
            return true
          case 'custom':
            if (filters.customStartDate && filters.customEndDate) {
              return isDateInRange(expenseDate, filters.customStartDate, filters.customEndDate)
            } else if (filters.customStartDate) {
              const startDate = parseDateLocal(filters.customStartDate)
              if (!startDate) return false
              const comparison = compareDates(expenseDate, startDate)
              return comparison !== null && (comparison === 0 || comparison === 1)
            } else if (filters.customEndDate) {
              const endDate = parseDateLocal(filters.customEndDate)
              if (!endDate) return false
              const comparison = compareDates(expenseDate, endDate)
              return comparison !== null && (comparison === 0 || comparison === -1)
            }
            return true
          default:
            return true
        }
      })
    }
    
    // Filtro por categoría
    if (filters.category !== 'all') {
      result = result.filter(expense => expense.categoria_nombre === filters.category)
    }
    
    // Filtro por moneda
    if (filters.currency !== 'all') {
      result = result.filter(expense => (expense.moneda_original || 'LPS') === filters.currency)
    }
    
    return result
  }, [expenses, filters])

  // Separar gastos de ingresos
  const gastos = useMemo(() => {
    return filteredExpenses.filter(expense => {
      const esIngreso = expense.es_entrada === true || expense.es_entrada === 1 || expense.es_entrada === 'true' || expense.es_entrada === '1'
      return !esIngreso
    })
  }, [filteredExpenses])

  const ingresos = useMemo(() => {
    return filteredExpenses.filter(expense => {
      const esIngreso = expense.es_entrada === true || expense.es_entrada === 1 || expense.es_entrada === 'true' || expense.es_entrada === '1'
      return esIngreso
    })
  }, [filteredExpenses])

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      period: 'all',
      category: 'all',
      currency: 'all',
      year: new Date().getFullYear(),
      month: '',
      customStartDate: '',
      customEndDate: ''
    })
  }, [])

  return {
    filters,
    filteredExpenses,
    gastos,
    ingresos,
    handleFilterChange,
    clearFilters
  }
}
