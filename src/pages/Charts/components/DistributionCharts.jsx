import React, { useRef } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import { formatCurrency } from '../utils/chartFormatters'

/**
 * Componente para gráficos de distribución (Pie y Bar)
 */
const DistributionCharts = ({ chartData, chartOptions, barOptions }) => {
  const barChartRef = useRef(null)

  if (!chartData.pie || !chartData.bar) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No hay datos para mostrar</h3>
        <p className="text-gray-500">Intenta ajustar los filtros</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {/* Gráfico de Torta */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">🥧 Distribución por Categorías</h3>
        <div className="h-64">
          <Pie data={chartData.pie} options={chartOptions} />
        </div>
      </div>

      {/* Gráfico de Barras con Zoom */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">📊 Gastos por Categoría</h3>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <span>🔍 Zoom: Rueda</span>
          </div>
        </div>
        <div className="h-64">
          <Bar 
            ref={barChartRef}
            data={{
              ...chartData.bar,
              datasets: chartData.bar.datasets.map(dataset => ({
                ...dataset,
                barThickness: 'flex', // Permite que las barras se ajusten al zoom
                maxBarThickness: undefined // Sin límite máximo para que crezcan con el zoom
              }))
            }} 
            options={{
              ...barOptions,
              scales: {
                ...barOptions.scales,
                y: {
                  ...barOptions.scales.y,
                  beginAtZero: true,
                  min: 0 // No permitir valores negativos en el eje Y
                }
              },
              plugins: {
                ...barOptions.plugins,
                zoom: {
                  zoom: {
                    wheel: {
                      enabled: true,
                      speed: 0.05 // Zoom más moderado
                    },
                    pinch: {
                      enabled: true
                    },
                    mode: 'xy',
                    limits: {
                      x: { min: 'original', max: 'original' },
                      y: { 
                        min: (ctx) => {
                          // Siempre mantener el mínimo en 0
                          return 0
                        },
                        max: 'original' 
                      }
                    }
                  },
                  pan: {
                    enabled: true,
                    mode: 'x', // Solo desplazamiento horizontal
                    limits: {
                      x: { min: 'original', max: 'original' },
                      y: { 
                        min: (ctx) => {
                          // Siempre mantener el mínimo en 0, no permitir desplazarse a valores negativos
                          return 0
                        },
                        max: 'original' 
                      }
                    }
                  }
                }
              },
              animation: {
                duration: 0 // Desactivar animación para mejor rendimiento del zoom
              },
              interaction: {
                intersect: false,
                mode: 'index'
              },
              responsive: true,
              maintainAspectRatio: false
            }} 
          />
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => {
              if (barChartRef.current) {
                barChartRef.current.resetZoom()
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            🔄 Restablecer Zoom
          </button>
        </div>
      </div>
    </div>
  )
}

export default DistributionCharts
