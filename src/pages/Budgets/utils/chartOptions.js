import { formatCurrency, formatDate } from './budgetFormatters'

/**
 * Opciones de configuración para gráficos de presupuestos
 */

export const createBarChartOptions = (currentMonth) => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#e4e4e7'
      }
    },
    title: {
      display: true,
      text: `Presupuestos vs Gastos - ${formatDate(currentMonth)}`,
      color: '#e4e4e7'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255,255,255,0.08)'
      },
      ticks: {
        color: '#a1a1aa',
        callback: function(value) {
          return formatCurrency(value)
        }
      }
    },
    x: {
      ticks: { color: '#a1a1aa' },
      grid: { display: false }
    }
  }
})

export const createDoughnutChartOptions = () => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        color: '#e4e4e7'
      }
    },
    title: {
      display: true,
      text: 'Distribución de Gastos por Categoría',
      color: '#e4e4e7'
    }
  }
})
