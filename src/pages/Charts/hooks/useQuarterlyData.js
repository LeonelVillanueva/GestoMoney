import { useMemo } from 'react'
import { parseDateLocal } from '../../../utils/normalizers'

/**
 * Hook para calcular datos trimestrales
 */
export const useQuarterlyData = (expenses, year) => {
  const quarterlyData = useMemo(() => {
    if (!expenses || expenses.length === 0) return null

    const quarters = [
      { name: 'Q1', months: [0, 1, 2], label: 'Enero - Marzo' },
      { name: 'Q2', months: [3, 4, 5], label: 'Abril - Junio' },
      { name: 'Q3', months: [6, 7, 8], label: 'Julio - Septiembre' },
      { name: 'Q4', months: [9, 10, 11], label: 'Octubre - Diciembre' }
    ]

    return quarters.map(quarter => {
      let totalGastos = 0
      let totalIngresos = 0
      let transactionCount = 0

      expenses.forEach(expense => {
        const expenseDate = parseDateLocal(expense.fecha)
        if (!expenseDate) return
        if (expenseDate.getFullYear() === year && quarter.months.includes(expenseDate.getMonth())) {
          const amount = parseFloat(expense.monto)
          
          if (!isNaN(amount) && amount >= 0) {
            if (expense.es_entrada) {
              totalIngresos += amount
            } else {
              totalGastos += amount
            }
            transactionCount++
          }
        }
      })

      return {
        ...quarter,
        gastos: totalGastos,
        ingresos: totalIngresos,
        neto: totalIngresos - totalGastos,
        transacciones: transactionCount
      }
    })
  }, [expenses, year])

  return quarterlyData
}
