import React from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { formatDate } from '../utils/expenseFormatters'

/**
 * Componente de gráficos de gastos
 */
const ExpenseCharts = ({ calculations, chartOptions, pieChartOptions }) => {
  const pieChartData = {
    labels: calculations.categoryBreakdown.map(cat => cat.name),
    datasets: [{
      data: calculations.categoryBreakdown.map(cat => cat.total),
      backgroundColor: calculations.categoryBreakdown.map(cat => cat.color),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const barChartData = {
    labels: calculations.categoryBreakdown.map(cat => cat.name),
    datasets: [{
      label: 'Gastos por Categoría',
      data: calculations.categoryBreakdown.map(cat => cat.total),
      backgroundColor: calculations.categoryBreakdown.map(cat => cat.color),
      borderColor: calculations.categoryBreakdown.map(cat => cat.color),
      borderWidth: 1
    }]
  }

  const lineChartData = {
    labels: calculations.dailyBreakdown.map(day => formatDate(day.date)),
    datasets: [{
      label: 'Gastos Diarios',
      data: calculations.dailyBreakdown.map(day => day.total),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  }

  return (
    <>
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Gastos por Categoría</h3>
          <div className="h-80">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico Circular */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🥧 Distribución de Gastos</h3>
          <div className="h-80">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico de Líneas - Más Ancho */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Tendencia Diaria</h3>
        <div className="h-96 w-full">
          <Line data={lineChartData} options={{
            ...chartOptions,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              ...chartOptions.plugins,
              title: {
                display: true,
                text: 'Evolución de Gastos por Día'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return new Intl.NumberFormat('es-HN', {
                      style: 'currency',
                      currency: 'HNL',
                      minimumFractionDigits: 2
                    }).format(value)
                  }
                }
              },
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }} />
        </div>
      </div>
    </>
  )
}

export default ExpenseCharts
