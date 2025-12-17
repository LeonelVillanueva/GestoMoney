/**
 * Opciones de configuración para gráficos
 */

export const createChartOptions = () => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Análisis de Gastos'
    }
  }
})

export const createPieChartOptions = () => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'right',
    },
    title: {
      display: true,
      text: 'Distribución por Categorías'
    }
  }
})
