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
      borderColor: 'rgba(39, 39, 42, 0.95)'
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

  // Calcular altura dinámica según cantidad de categorías
  const categoryCount = calculations.categoryBreakdown.length
  const pieContainerHeight = categoryCount > 6 ? 'h-96' : 'h-72'

  return (
    <>
      {/* Gráficos Compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Barras */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-3">Gastos por categoría</h3>
          <div className={`${pieContainerHeight} rounded-lg border border-zinc-800/80 bg-zinc-900/35 p-2`}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico Circular */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-3">Distribución</h3>
          <div className={`${pieContainerHeight} rounded-lg border border-zinc-800/80 bg-zinc-900/35 p-2`}>
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico de Líneas Compacto con Zoom */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-zinc-100">Tendencia diaria</h3>
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>Zoom: rueda del ratón</span>
            <span>•</span>
            <span>Pan: click y arrastrar</span>
          </div>
        </div>
        <div className="h-72 w-full rounded-lg border border-zinc-800/80 bg-zinc-900/35 p-2">
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
                position: 'top',
                labels: {
                  color: '#a1a1aa',
                  font: { size: 11 }
                }
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
                ...chartOptions.scales?.y,
                beginAtZero: true,
                ticks: {
                  ...chartOptions.scales?.y?.ticks,
                  color: '#a1a1aa',
                  callback: function(value) {
                    return new Intl.NumberFormat('es-HN', {
                      style: 'currency',
                      currency: 'HNL',
                      minimumFractionDigits: 2
                    }).format(value)
                  }
                },
                grid: {
                  color: 'rgba(255,255,255,0.08)'
                }
              },
              x: {
                ...chartOptions.scales?.x,
                ticks: {
                  ...chartOptions.scales?.x?.ticks,
                  maxRotation: 45,
                  minRotation: 45,
                  color: '#a1a1aa'
                },
                grid: {
                  color: 'rgba(255,255,255,0.06)'
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
            type="button"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-600 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Restablecer zoom
          </button>
        </div>
      </div>
    </>
  )
}

export default ExpenseCharts
