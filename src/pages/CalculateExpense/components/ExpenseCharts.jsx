import React, { useRef } from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { formatDate } from '../utils/expenseFormatters'

/**
 * Componente de gráficos de gastos
 */
const ExpenseCharts = ({ calculations, chartOptions, pieChartOptions }) => {
  const lineChartRef = useRef(null)
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
      {/* Gráficos Compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Barras */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">📊 Gastos por Categoría</h3>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico Circular */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">🥧 Distribución</h3>
          <div className="h-64">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico de Líneas Compacto con Zoom */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">📈 Tendencia Diaria</h3>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>🔍 Zoom: Rueda del ratón</span>
            <span>•</span>
            <span>🖱️ Pan: Click y arrastrar</span>
          </div>
        </div>
        <div className="h-72 w-full">
          <Line 
            ref={lineChartRef}
            data={lineChartData} 
            options={{
            ...chartOptions,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              ...chartOptions.plugins,
              title: {
                display: false
              },
              legend: {
                display: true,
                position: 'top'
              },
              zoom: {
                zoom: {
                  wheel: {
                    enabled: true,
                    speed: 0.1
                  },
                  pinch: {
                    enabled: true
                  },
                  mode: 'x',
                  limits: {
                    x: { min: 'original', max: 'original' },
                    y: { min: 'original', max: 'original' }
                  }
                },
                pan: {
                  enabled: true,
                  mode: 'x',
                  limits: {
                    x: { min: 'original', max: 'original' },
                    y: { min: 'original', max: 'original' }
                  }
                }
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
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }} />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => {
              if (lineChartRef.current) {
                lineChartRef.current.resetZoom()
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            🔄 Restablecer Zoom
          </button>
        </div>
      </div>
    </>
  )
}

export default ExpenseCharts
