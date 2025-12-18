/**
 * Opciones de configuración para gráficos
 */

export const createChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const formatted = new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 0
          }).format(context.parsed.y)
          return `${context.dataset.label}: ${formatted}`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        font: {
          size: 10
        }
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(value)
        },
        font: {
          size: 10
        }
      }
    }
  }
})

export const createPieChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 8,
        font: {
          size: 11
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    title: {
      display: true,
      text: 'Distribución por Categorías',
      font: {
        size: 12,
        weight: 'bold'
      },
      padding: {
        bottom: 10
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const value = context.parsed
          const percentage = ((value / total) * 100).toFixed(1)
          const formatted = new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 0
          }).format(value)
          return `${context.label}: ${formatted} (${percentage}%)`
        }
      }
    }
  }
})
