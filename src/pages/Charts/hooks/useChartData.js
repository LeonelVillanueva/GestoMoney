import { useState, useEffect, useCallback, useMemo } from 'react'
import { parseDateLocal } from '../../../utils/normalizers'
import { CHART_COLORS } from '../utils/chartFormatters'
import { calculateCategoryTotals, calculateMonthlyData, calculateDailyData, calculateHistoricalDailyData } from '../utils/chartCalculations'

/**
 * Hook para generar datos de gráficos
 */
export const useChartData = (filteredExpenses, gastos, ingresos, filters) => {
  const [chartData, setChartData] = useState({
    pie: null,
    bar: null,
    line: null
  })
  const [hasData, setHasData] = useState(false)

  const generateChartData = useCallback(() => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      setHasData(false)
      setChartData({
        pie: null,
        bar: null,
        line: null
      })
      return
    }

    setHasData(true)
    
    // Calcular totales por categoría
    const categoryTotals = calculateCategoryTotals(gastos)
    const categories = Object.keys(categoryTotals)
    const amounts = Object.values(categoryTotals)

    // Validar que tengamos datos válidos
    if (categories.length === 0 || amounts.every(amount => amount === 0)) {
      setChartData({
        pie: null,
        bar: null,
        line: null
      })
      return
    }

    // Filtrar solo montos NaN, permitir 0
    const validData = categories.map((category, index) => ({
      category,
      amount: amounts[index]
    })).filter(item => !isNaN(item.amount))

    if (validData.length === 0) {
      setChartData({
        pie: null,
        bar: null,
        line: null
      })
      return
    }

    const validCategories = validData.map(item => item.category)
    const validAmounts = validData.map(item => item.amount)

    // Gráfico de torta
    const pieData = {
      labels: validCategories,
      datasets: [{
        data: validAmounts,
        backgroundColor: CHART_COLORS.slice(0, validCategories.length),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 10
      }]
    }

    // Gráfico de barras
    const barData = {
      labels: validCategories,
      datasets: [{
        label: 'Gastos por Categoría',
        data: validAmounts,
        backgroundColor: CHART_COLORS.slice(0, validCategories.length).map(color => color + '80'),
        borderColor: CHART_COLORS.slice(0, validCategories.length),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    }

    // Gráfico de línea (histórico completo por día, últimos 30 días, o por mes según filtro)
    let lineData
    if (filters.period === 'all') {
      // Mostrar toda la trayectoria histórica por día (todas las fechas)
      const historicalData = calculateHistoricalDailyData(gastos, ingresos)
      lineData = {
        labels: historicalData.labels,
        datasets: [{
          label: 'Neto Diario (Gastos - Ingresos)',
          data: historicalData.data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: {
            target: 'origin',
            above: 'rgba(59, 130, 246, 0.1)',
            below: 'rgba(239, 68, 68, 0.1)'
          },
          tension: 0.4,
          pointBackgroundColor: function(context) {
            const value = context.parsed.y
            return value === 0 ? '#94a3b8' : value > 0 ? '#10b981' : '#ef4444'
          },
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4,
          spanGaps: false
        }]
      }
    } else if (filters.period === 'quarter' || filters.period === 'year') {
      // Gráfico por meses del año seleccionado
      const monthlyData = calculateMonthlyData(gastos, filters.year)
      lineData = {
        labels: monthlyData.labels,
        datasets: [{
          label: 'Gastos Mensuales',
          data: monthlyData.data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      }
    } else {
      // Gráfico por días (últimos 30 días)
      const dailyData = calculateDailyData(gastos, ingresos)
      lineData = {
        labels: dailyData.labels,
        datasets: [{
          label: 'Neto Diario (Gastos - Ingresos)',
          data: dailyData.data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          fill: {
            target: 'origin',
            above: 'rgba(59, 130, 246, 0.1)',
            below: 'rgba(239, 68, 68, 0.1)'
          },
          tension: 0.4,
          pointBackgroundColor: function(context) {
            const value = context.parsed.y
            return value === 0 ? '#94a3b8' : '#3b82f6'
          },
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: function(context) {
            const value = context.parsed.y
            return value === 0 ? 3 : 4
          },
          pointHoverRadius: 6,
          spanGaps: false
        }]
      }
    }

    setChartData({
      pie: pieData,
      bar: barData,
      line: lineData
    })
  }, [filteredExpenses, gastos, ingresos, filters])

  useEffect(() => {
    generateChartData()
  }, [generateChartData])

  return {
    chartData,
    hasData
  }
}
