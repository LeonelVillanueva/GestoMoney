import React, { useRef } from 'react'
import { Line } from 'react-chartjs-2'

/**
 * Componente para gráfico de tendencias (Line)
 */
const TrendsChart = ({ chartData, lineOptions, period }) => {
  const lineChartRef = useRef(null)

  if (!chartData.line) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No hay datos para mostrar</h3>
        <p className="text-gray-500">Intenta ajustar los filtros</p>
      </div>
    )
  }

  const getTitle = () => {
    if (period === 'all') {
      return 'Tendencias Históricas (Todos los Períodos)'
    } else if (period === 'quarter' || period === 'year') {
      return 'Tendencias Mensuales'
    } else {
      return 'Tendencias Diarias'
    }
  }

  const title = getTitle()

  return (
    <div className="glass-card rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">📈 {title}</h3>
        {period === 'all' && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>🔍 Zoom: Rueda del ratón</span>
            <span>•</span>
            <span>🖱️ Desplazar: Click y arrastrar</span>
          </div>
        )}
      </div>
      <div className="h-72">
        <Line 
          ref={lineChartRef}
          data={chartData.line} 
          options={{
            ...lineOptions,
            plugins: {
              ...lineOptions.plugins,
              ...(period === 'all' ? {
                // Zoom limitado y pan horizontal para período 'all'
                zoom: {
                  zoom: {
                    wheel: {
                      enabled: true,
                      speed: 0.04 // Zoom lento para control gradual (permite acercarse poco a poco)
                    },
                    pinch: {
                      enabled: true
                    },
                    mode: 'x',
                    limits: {
                      // Limitar el zoom máximo usando el número de puntos visibles
                      x: {
                        min: (ctx) => {
                          if (!ctx.chart || !ctx.chart.data || !ctx.chart.data.labels) return undefined
                          const totalPoints = ctx.chart.data.labels.length
                          if (totalPoints <= 30) return undefined // Si hay pocos puntos, no limitar
                          // Limitar a mostrar mínimo 30 puntos (para separar bien las fechas)
                          return Math.max(0, totalPoints - Math.floor(totalPoints * 0.3))
                        },
                        max: (ctx) => {
                          if (!ctx.chart || !ctx.chart.data || !ctx.chart.data.labels) return undefined
                          const totalPoints = ctx.chart.data.labels.length
                          if (totalPoints <= 30) return undefined // Si hay pocos puntos, no limitar
                          // Limitar a mostrar mínimo 30 puntos desde el inicio
                          return Math.min(totalPoints - 1, Math.ceil(totalPoints * 0.3))
                        }
                      },
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
              } : {
                // Zoom y pan para otros períodos
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
              })
            }
          }} 
        />
      </div>
      {period !== 'all' && (
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
      )}
    </div>
  )
}

export default TrendsChart
