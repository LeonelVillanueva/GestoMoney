import { useState, useEffect } from 'react'
import settingsManager from '../utils/services/settings'

/**
 * Hook para manejar el zoom de la interfaz en móviles
 */
const useZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(() => {
    // Cargar zoom guardado o usar valor por defecto (100%)
    const saved = settingsManager.get('mobileZoom', 100)
    return saved
  })

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Aplicar zoom solo en móvil
  useEffect(() => {
    if (isMobile) {
      // Aplicar zoom usando CSS transform scale al root
      const root = document.documentElement
      const scale = zoomLevel / 100
      root.style.zoom = scale
      
      // Alternativa usando transform (si zoom no funciona en algunos navegadores)
      // root.style.transform = `scale(${scale})`
      // root.style.transformOrigin = 'top left'
      // root.style.width = `${100 / scale}%`
      // root.style.height = `${100 / scale}%`
    } else {
      // Resetear zoom en desktop
      document.documentElement.style.zoom = '1'
    }
  }, [zoomLevel, isMobile])

  const increaseZoom = () => {
    const newZoom = Math.min(150, zoomLevel + 5) // Máximo 150%
    setZoomLevel(newZoom)
    settingsManager.set('mobileZoom', newZoom)
  }

  const decreaseZoom = () => {
    const newZoom = Math.max(50, zoomLevel - 5) // Mínimo 50%
    setZoomLevel(newZoom)
    settingsManager.set('mobileZoom', newZoom)
  }

  const resetZoom = () => {
    setZoomLevel(100)
    settingsManager.set('mobileZoom', 100)
  }

  return {
    zoomLevel,
    isMobile,
    increaseZoom,
    decreaseZoom,
    resetZoom,
    setZoomLevel: (level) => {
      const clamped = Math.max(50, Math.min(150, level))
      setZoomLevel(clamped)
      settingsManager.set('mobileZoom', clamped)
    }
  }
}

export default useZoom
