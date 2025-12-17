import { formatCurrency, formatDate } from './budgetFormatters'

/**
 * Opciones de configuración para gráficos de presupuestos
 */

export const createBarChartOptions = (currentMonth) => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: `Presupuestos vs Gastos - ${formatDate(currentMonth)}`
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return formatCurrency(value)
        }
      }
    }
  }
})

export const createDoughnutChartOptions = () => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'right',
    },
    title: {
      display: true,
      text: 'Distribución de Gastos por Categoría'
    }
  }
})
