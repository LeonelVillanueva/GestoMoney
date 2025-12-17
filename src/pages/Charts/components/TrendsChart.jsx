import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Line } from 'react-chartjs-2'

/**
 * Componente para gráfico de tendencias (Line)
 */
const TrendsChart = ({ chartData, lineOptions, period }) => {
  const lineChartRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isRotated, setIsRotated] = useState(false)

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

  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevenir scroll del body cuando está en fullscreen y resetear rotación al cerrar
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setIsRotated(false) // Resetear rotación al cerrar
    }
    return () => {
      document.body.style.overflow = ''
      setIsRotated(false)
    }
  }, [isFullscreen])

  const title = getTitle()

  // Opciones del gráfico (reutilizables)
  const chartOptions = {
    ...lineOptions,
    plugins: {
      ...lineOptions.plugins,
      ...(period === 'all' ? {
        // Zoom limitado y pan horizontal para período 'all'
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.04
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
            limits: {
              x: {
                min: (ctx) => {
                  if (!ctx.chart || !ctx.chart.data || !ctx.chart.data.labels) return undefined
                  const totalPoints = ctx.chart.data.labels.length
                  if (totalPoints <= 30) return undefined
                  return Math.max(0, totalPoints - Math.floor(totalPoints * 0.3))
                },
                max: (ctx) => {
                  if (!ctx.chart || !ctx.chart.data || !ctx.chart.data.labels) return undefined
                  const totalPoints = ctx.chart.data.labels.length
                  if (totalPoints <= 30) return undefined
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
  }

  const ChartContent = () => (
    <Line 
      ref={lineChartRef}
      data={chartData.line} 
      options={chartOptions} 
    />
  )

  // Si está en fullscreen, mostrar modal usando Portal (fuera del DOM normal)
  if (isFullscreen) {
    const modalContent = (
      <div 
        className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
        onClick={() => setIsFullscreen(false)}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}
      >
        {/* Contenedor del gráfico con scroll horizontal */}
        <div 
          className="bg-white rounded-xl p-4 md:p-6 w-full h-full flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxHeight: '100vh', 
            maxWidth: '100vw',
            overflowY: 'auto', 
            overflowX: 'auto'
          }}
        >
          {/* Header del modal - fijo arriba */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold text-slate-800">📈 {title}</h3>
            <div className="flex items-center gap-2">
              {isMobile && (
                <button
                  onClick={() => setIsRotated(!isRotated)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                  aria-label={isRotated ? "Rotar horizontal" : "Rotar vertical"}
                  title={isRotated ? "Volver a horizontal" : "Girar a vertical"}
                >
                  <span className="text-xl">{isRotated ? "🔄" : "📱"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsFullscreen(false)
                  setIsRotated(false) // Resetear rotación al cerrar
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                aria-label="Cerrar"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>
          
          {/* Instrucciones para móvil */}
          {isMobile && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex-shrink-0">
              {isRotated ? (
                <>📱 Gráfico en vertical - Desplázate verticalmente para ver todo</>
              ) : (
                <>👆 Desplázate horizontalmente para ver todo el gráfico</>
              )}
            </div>
          )}

          {/* Gráfico en contenedor scrolleable - área principal */}
          <div 
            className="flex-1 w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center" 
            style={{ 
              overflow: isRotated ? 'auto' : 'hidden',
              overflowX: isMobile && !isRotated ? 'auto' : 'hidden',
              overflowY: isMobile && isRotated ? 'auto' : 'hidden',
              WebkitOverflowScrolling: 'touch',
              position: 'relative'
            }}
          >
            {isMobile && isRotated ? (
              // Vista rotada: el gráfico está en vertical
              <div 
                style={{ 
                  transform: 'rotate(90deg)',
                  transformOrigin: 'center center',
                  transition: 'transform 0.4s ease',
                  width: '100vh',
                  height: '100vw',
                  maxWidth: '100vh',
                  maxHeight: '100vw',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ 
                  width: '100vw',
                  height: '1200px',
                  maxWidth: '100vw'
                }}>
                  <ChartContent />
                </div>
              </div>
            ) : (
              // Vista normal: scroll horizontal
              <div style={{ 
                width: isMobile ? '1200px' : '100%', 
                height: isMobile ? '400px' : '500px'
              }}>
                <ChartContent />
              </div>
            )}
          </div>

          {/* Botones de acción - fijo abajo */}
          <div className="mt-4 flex justify-between items-center flex-shrink-0 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              {period === 'all' && !isMobile && (
                <>
                  🔍 Zoom: Rueda del ratón • 🖱️ Desplazar: Click y arrastrar
                </>
              )}
            </div>
            {period !== 'all' && (
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
            )}
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-xs text-gray-600 hover:text-gray-800 font-medium px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
    
    // Renderizar en el body usando Portal para estar completamente fuera del layout
    return createPortal(modalContent, document.body)
  }

  // Vista normal
  return (
    <div className="glass-card rounded-xl p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800">📈 {title}</h3>
        <div className="flex items-center gap-3">
          {period === 'all' && !isMobile && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>🔍 Zoom: Rueda del ratón</span>
              <span>•</span>
              <span>🖱️ Desplazar: Click y arrastrar</span>
            </div>
          )}
          {isMobile && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              aria-label="Abrir en pantalla completa"
            >
              <span>🔍</span>
              <span>Ver completo</span>
            </button>
          )}
        </div>
      </div>
      <div 
        className="h-72 relative"
        onClick={isMobile ? () => setIsFullscreen(true) : undefined}
        style={isMobile ? { cursor: 'pointer' } : {}}
      >
        {isMobile && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg z-10 pointer-events-none">
            <div className="text-center p-4 bg-white rounded-lg shadow-lg">
              <div className="text-2xl mb-2">👆</div>
              <p className="text-sm font-medium text-gray-700">Toca para ver completo</p>
              <p className="text-xs text-gray-500 mt-1">Desplázate horizontalmente</p>
            </div>
          </div>
        )}
        <ChartContent />
      </div>
      {period !== 'all' && !isMobile && (
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
