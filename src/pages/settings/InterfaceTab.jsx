import React, { useState, useEffect } from 'react'
import settingsManager from '../../utils/services/settings'

export default function InterfaceTab({ settings, onSettingChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [mobileZoom, setMobileZoom] = useState(() => {
    return settingsManager.get('mobileZoom', 100)
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleZoomChange = (newZoom) => {
    const clamped = Math.max(50, Math.min(150, newZoom))
    setMobileZoom(clamped)
    settingsManager.set('mobileZoom', clamped)
    
    // Aplicar zoom inmediatamente si estamos en móvil
    if (window.innerWidth < 768) {
      document.documentElement.style.zoom = clamped / 100
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">🎨 Interfaz</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Elementos por página</label>
            <select value={settings.itemsPerPage} onChange={(e) => onSettingChange('itemsPerPage', parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value={10}>10 elementos</option>
              <option value={25}>25 elementos</option>
              <option value={50}>50 elementos</option>
              <option value={100}>100 elementos</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-800">Símbolo de moneda</div>
              <div className="text-xs text-gray-600">Mostrar L, $ en los montos</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.showCurrencySymbol} onChange={(e) => onSettingChange('showCurrencySymbol', e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Formato de fecha</label>
              <select value={settings.dateFormat} onChange={(e) => onSettingChange('dateFormat', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                <option value="yyyy-mm-dd">AAAA-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Formato de números</label>
              <select value={settings.numberFormat} onChange={(e) => onSettingChange('numberFormat', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="comma">1,234.56</option>
                <option value="dot">1.234,56</option>
                <option value="space">1 234.56</option>
              </select>
            </div>
          </div>

          {/* Zoom para móviles */}
          {isMobile && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  📱 Zoom de interfaz (Solo móvil)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Ajusta el tamaño de la interfaz para facilitar la lectura en dispositivos móviles
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleZoomChange(mobileZoom - 5)}
                  disabled={mobileZoom <= 50}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-blue-300 rounded-lg text-blue-600 font-bold text-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Reducir zoom"
                >
                  −
                </button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={mobileZoom}
                    onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>50%</span>
                    <span className="font-bold text-blue-600">{mobileZoom}%</span>
                    <span>150%</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleZoomChange(mobileZoom + 5)}
                  disabled={mobileZoom >= 150}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-blue-300 rounded-lg text-blue-600 font-bold text-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Aumentar zoom"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={() => handleZoomChange(100)}
                className="mt-3 w-full px-3 py-2 text-xs font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Restablecer a 100%
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}






