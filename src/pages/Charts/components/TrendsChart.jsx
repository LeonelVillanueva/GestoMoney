import React, { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Line } from 'react-chartjs-2'

/**
 * Componente para gráfico de tendencias (Line)
 */
const TrendsChart = ({ chartData, lineOptions, period }) => {
  const lineChartRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isRotated, setIsRotated] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [scrollMax, setScrollMax] = useState(0)

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

  // Actualizar posición y máximo del scroll
  useEffect(() => {
    const updateScrollInfo = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current
        const newScrollPosition = isRotated ? container.scrollTop : container.scrollLeft
        const newScrollMax = isRotated 
          ? container.scrollHeight - container.clientHeight
          : container.scrollWidth - container.clientWidth
        setScrollPosition(newScrollPosition)
        setScrollMax(newScrollMax)
      }
    }

    const container = scrollContainerRef.current
    if (container && isFullscreen) {
      container.addEventListener('scroll', updateScrollInfo)
      updateScrollInfo() // Actualizar al montar
      
      // También actualizar cuando cambia el tamaño del contenedor
      const resizeObserver = new ResizeObserver(updateScrollInfo)
      resizeObserver.observe(container)

      // Actualizar periódicamente para capturar cambios en el tamaño del gráfico
      const interval = setInterval(updateScrollInfo, 100)

      // Manejar scroll con rueda del mouse (event listener no-pasivo para poder usar preventDefault)
      const handleWheel = (e) => {
        if (container) {
          if (!isRotated) {
            // Scroll horizontal
            if (container.scrollWidth > container.clientWidth) {
              e.preventDefault()
              container.scrollLeft += e.deltaY
            }
          } else {
            // Scroll vertical cuando está rotado
            if (container.scrollHeight > container.clientHeight) {
              e.preventDefault()
              container.scrollTop += e.deltaY
            }
          }
        }
      }

      // Agregar event listener con opciones { passive: false } para permitir preventDefault
      container.addEventListener('wheel', handleWheel, { passive: false })

      return () => {
        container.removeEventListener('scroll', updateScrollInfo)
        container.removeEventListener('wheel', handleWheel)
        resizeObserver.disconnect()
        clearInterval(interval)
      }
    }
  }, [isFullscreen, isRotated])

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
        className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center"
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
          className="bg-white w-full h-full flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            maxHeight: '100vh', 
            maxWidth: '100vw'
          }}
        >
          {/* Header del modal - compacto y fijo arriba */}
          <div className="flex items-center justify-end gap-1 p-2 flex-shrink-0 border-b border-gray-200">
            {/* Botón de rotación */}
            <button
              onClick={() => setIsRotated(!isRotated)}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-800"
              aria-label={isRotated ? "Rotar horizontal" : "Rotar vertical"}
              title={isRotated ? "Horizontal" : "Vertical"}
            >
              <span className="text-lg">{isRotated ? "🔄" : "📱"}</span>
            </button>
            {/* Botón cerrar */}
            <button
              onClick={() => {
                setIsFullscreen(false)
                setIsRotated(false)
              }}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600 hover:text-gray-800"
              aria-label="Cerrar"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Gráfico en contenedor scrolleable - área principal maximizada */}
          <div 
            className="flex-1 w-full bg-white flex flex-col items-center justify-center" 
            style={{ 
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Contenedor interno con scroll - permite scroll manual (rueda del mouse, touch, y arrastre) */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 w-full flex items-center justify-center overflow-auto"
              style={{ 
                overflowX: !isRotated ? 'auto' : 'hidden',
                overflowY: isRotated ? 'auto' : 'hidden',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: '#9ca3af #f3f4f6',
                cursor: isRotated ? 'default' : 'grab'
              }}
              onMouseDown={(e) => {
                // Permitir scroll manual con click y arrastre (solo si no es click en el gráfico)
                if (e.button === 0 && e.target === e.currentTarget) {
                  const startX = e.clientX
                  const startScrollLeft = scrollContainerRef.current?.scrollLeft || 0
                  let isDragging = false
                  
                  const handleMouseMove = (moveEvent) => {
                    isDragging = true
                    if (scrollContainerRef.current) {
                      const deltaX = startX - moveEvent.clientX
                      scrollContainerRef.current.scrollLeft = startScrollLeft + deltaX
                    }
                  }
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove)
                    document.removeEventListener('mouseup', handleMouseUp)
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.style.cursor = 'grab'
                    }
                  }
                  
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.style.cursor = 'grabbing'
                  }
                  
                  document.addEventListener('mousemove', handleMouseMove)
                  document.addEventListener('mouseup', handleMouseUp)
                }
              }}
            >
              {isRotated ? (
                // Vista rotada: el gráfico está en vertical (rotado 90 grados)
                // Cuando rotamos 90°, el ancho se convierte en altura y viceversa
                // Usamos el ancho disponible (100vh aproximado) como altura del contenedor rotado
                <div 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: isMobile ? '1200px' : '1400px',
                    padding: '0'
                  }}
                >
                  {/* Contenedor que rota el gráfico 90 grados */}
                  {/* Después de rotar, el ancho del contenedor se convierte en la altura visible */}
                  <div 
                    style={{ 
                      transform: 'rotate(90deg)',
                      transformOrigin: 'center center',
                      transition: 'transform 0.4s ease',
                      // Usamos el ancho completo disponible, que después de rotar será la altura
                      width: '100%',
                      // La altura del contenedor rotado será el ancho original del gráfico
                      height: isMobile ? '1200px' : '1400px',
                      maxWidth: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Contenedor interno con las dimensiones originales del gráfico */}
                    {/* Este se ajusta al 100% del ancho del contenedor rotado */}
                    <div style={{ 
                      width: '100%',
                      height: isMobile ? '400px' : '500px',   // altura original del gráfico
                      maxWidth: isMobile ? '1200px' : '1400px'
                    }}>
                      <ChartContent />
                    </div>
                  </div>
                </div>
              ) : (
                // Vista normal: scroll horizontal
                <div style={{ 
                  width: isMobile ? '1200px' : '100%', 
                  height: isMobile ? '400px' : '500px',
                  minWidth: isMobile ? '1200px' : 'auto'
                }}>
                  <ChartContent />
                </div>
              )}
            </div>

            {/* Barra de scroll personalizada compacta - solo cuando hay scroll disponible */}
            {scrollMax > 5 && !isRotated && (
              <div className="absolute bottom-2 left-2 right-2 z-10">
                <div 
                  className="relative h-2 bg-gray-200/80 rounded-full cursor-pointer backdrop-blur-sm"
                  onClick={(e) => {
                    if (!scrollContainerRef.current) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    const percentage = clickX / rect.width
                    const targetScroll = percentage * scrollMax
                    scrollContainerRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' })
                  }}
                >
                  {(() => {
                    const container = scrollContainerRef.current
                    const visibleRatio = container ? container.clientWidth / container.scrollWidth : 1
                    const thumbWidth = Math.max(15, visibleRatio * 100)
                    const scrollPercentage = scrollMax > 0 ? (scrollPosition / scrollMax) * 100 : 0
                    
                    return (
                      <div
                        className="absolute h-full bg-blue-500 rounded-full transition-all duration-150 cursor-grab active:cursor-grabbing hover:bg-blue-600"
                        style={{
                          left: `${Math.min(scrollPercentage, 100 - thumbWidth)}%`,
                          width: `${thumbWidth}%`
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!scrollContainerRef.current) return
                          
                          const startX = e.clientX
                          const startScrollLeft = scrollContainerRef.current.scrollLeft
                          const rect = e.currentTarget.parentElement.getBoundingClientRect()
                          const thumbWidthPx = (thumbWidth / 100) * rect.width
                          const trackWidth = rect.width - thumbWidthPx
                          
                          const handleMouseMove = (moveEvent) => {
                            const deltaX = moveEvent.clientX - startX
                            const scrollRatio = scrollMax / trackWidth
                            const newScrollLeft = Math.max(0, Math.min(scrollMax, startScrollLeft + deltaX * scrollRatio))
                            scrollContainerRef.current.scrollLeft = newScrollLeft
                          }
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove)
                            document.removeEventListener('mouseup', handleMouseUp)
                          }
                          
                          document.addEventListener('mousemove', handleMouseMove)
                          document.addEventListener('mouseup', handleMouseUp)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )
                  })()}
                </div>
              </div>
            )}
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
