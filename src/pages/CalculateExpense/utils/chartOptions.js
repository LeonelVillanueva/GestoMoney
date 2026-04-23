/**
 * Opciones de configuración para gráficos
 */

export const createChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: 8
  },
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(9, 9, 11, 0.96)',
      borderColor: 'rgba(63, 63, 70, 0.9)',
      borderWidth: 1,
      titleColor: '#f4f4f5',
      bodyColor: '#e4e4e7',
      displayColors: true,
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
      border: {
        color: 'rgba(255,255,255,0.1)'
      },
      ticks: {
        maxRotation: 45,
        minRotation: 45,
        color: '#a1a1aa',
        font: {
          size: 10
        }
      },
      grid: {
        color: 'rgba(255,255,255,0.06)'
      }
    },
    y: {
      beginAtZero: true,
      border: {
        color: 'rgba(255,255,255,0.1)'
      },
      grid: {
        color: 'rgba(255,255,255,0.08)'
      },
      ticks: {
        color: '#a1a1aa',
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
  layout: {
    padding: 8
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        padding: 8,
        color: '#e4e4e7',
        font: {
          size: 11
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    title: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(9, 9, 11, 0.96)',
      borderColor: 'rgba(63, 63, 70, 0.9)',
      borderWidth: 1,
      titleColor: '#f4f4f5',
      bodyColor: '#e4e4e7',
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
