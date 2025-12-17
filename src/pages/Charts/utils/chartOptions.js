import { formatCurrency } from './chartFormatters'

/**
 * Opciones de configuración para gráficos
 */

export const createChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
          family: 'Inter'
        }
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let value = 0
          if (typeof context.parsed === 'number') {
            value = context.parsed
          } else if (typeof context.raw === 'number') {
            value = context.raw
          } else if (typeof context.parsed === 'object' && context.parsed !== null) {
            value = context.parsed.y || context.parsed || 0
          } else if (typeof context.raw === 'object' && context.raw !== null) {
            value = context.raw.y || context.raw || 0
          }
          
          return `${context.label}: ${formatCurrency(value)}`
        }
      }
    }
  }
})

export const createBarOptions = () => {
  const baseOptions = createChartOptions()
  return {
    ...baseOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          callback: function(value) {
            if (isNaN(value)) {
              return 'L0'
            }
            return formatCurrency(value)
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }
}

export const createLineOptions = () => {
  const baseOptions = createChartOptions()
  return {
    ...baseOptions,
    scales: {
      y: {
        beginAtZero: false, // No forzar comenzar en cero para mejor visualización
        grid: {
          color: 'rgba(0,0,0,0.1)'
        },
        ticks: {
          callback: function(value) {
            if (isNaN(value)) {
              return 'L0'
            }
            return formatCurrency(value)
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false, // Mostrar todos los labels
          maxTicksLimit: undefined // Sin límite de ticks
        }
      }
    },
    elements: {
      point: {
        radius: function(context) {
          const value = context.parsed.y
          return value === 0 ? 4 : 4
        }
      },
      line: {
        tension: 0.4,
        borderJoinStyle: 'round',
        borderCapStyle: 'round'
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }
}
