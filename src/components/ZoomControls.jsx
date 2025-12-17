import React, { useState, useEffect } from 'react'
import settingsManager from '../utils/services/settings'

/**
 * Controles de zoom flotantes para móviles
 */
const ZoomControls = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [zoomLevel, setZoomLevel] = useState(() => {
    return settingsManager.get('mobileZoom', 100)
  })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        const savedZoom = settingsManager.get('mobileZoom', 100)
        document.documentElement.style.zoom = savedZoom / 100
      } else {
        document.documentElement.style.zoom = '1'
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const updateZoom = (newZoom) => {
    const clamped = Math.max(75, Math.min(150, newZoom))
    setZoomLevel(clamped)
    settingsManager.set('mobileZoom', clamped)
    if (isMobile) {
      document.documentElement.style.zoom = clamped / 100
    }
  }

  const increaseZoom = () => updateZoom(zoomLevel + 10)
  const decreaseZoom = () => updateZoom(zoomLevel - 10)

  // Solo mostrar en móvil
  if (!isMobile) return null

  return (
    <>
      {/* Botón flotante para mostrar/ocultar controles */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-blue-700 transition-colors"
        aria-label="Controles de zoom"
      >
        🔍
      </button>

      {/* Controles de zoom */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 flex flex-col items-center gap-2 min-w-[80px]">
          <button
            onClick={increaseZoom}
            disabled={zoomLevel >= 150}
            className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-bold text-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar zoom"
          >
            +
          </button>
          
          <div className="text-xs font-bold text-gray-700 min-w-[50px] text-center">
            {zoomLevel}%
          </div>
          
          <button
            onClick={decreaseZoom}
            disabled={zoomLevel <= 75}
            className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-bold text-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Reducir zoom"
          >
            −
          </button>
          
          {zoomLevel !== 100 && (
            <button
              onClick={() => updateZoom(100)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </>
  )
}

export default ZoomControls
