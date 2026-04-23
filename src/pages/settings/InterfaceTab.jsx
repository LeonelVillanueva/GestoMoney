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
        <h3 className="text-sm font-bold text-zinc-100 mb-3">🎨 Interfaz</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Elementos por página</label>
            <select value={settings.itemsPerPage} onChange={(e) => onSettingChange('itemsPerPage', parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value={10}>10 elementos</option>
              <option value={25}>25 elementos</option>
              <option value={50}>50 elementos</option>
              <option value={100}>100 elementos</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-zinc-100">Símbolo de moneda</div>
              <div className="text-xs text-zinc-400">Mostrar L, $ en los montos</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.showCurrencySymbol} onChange={(e) => onSettingChange('showCurrencySymbol', e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Formato de fecha</label>
              <select value={settings.dateFormat} onChange={(e) => onSettingChange('dateFormat', e.target.value)} className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                <option value="yyyy-mm-dd">AAAA-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Formato de números</label>
              <select value={settings.numberFormat} onChange={(e) => onSettingChange('numberFormat', e.target.value)} className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="comma">1,234.56</option>
                <option value="dot">1.234,56</option>
                <option value="space">1 234.56</option>
              </select>
            </div>
          </div>

          {/* Zoom para móviles */}
          {isMobile && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-zinc-100 mb-1">
                  📱 Zoom de interfaz (Solo móvil)
                </label>
                <p className="text-xs text-zinc-400 mb-3">
                  Ajusta el tamaño de la interfaz para facilitar la lectura en dispositivos móviles
                </p>
              </div>
              
              <div className="flex items-stretch gap-3">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleZoomChange(mobileZoom + 5)}
                    disabled={mobileZoom >= 150}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/15 text-xl font-bold text-emerald-200 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Aumentar zoom"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleZoomChange(mobileZoom - 5)}
                    disabled={mobileZoom <= 50}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/35 bg-rose-500/15 text-xl font-bold text-rose-200 transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Reducir zoom"
                  >
                    −
                  </button>
                </div>

                <div className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950/60 p-3">
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={mobileZoom}
                    onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-400 mt-1">
                    <span>50%</span>
                    <span className="font-bold text-blue-300">{mobileZoom}%</span>
                    <span>150%</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleZoomChange(100)}
                className="mt-3 w-full rounded-lg border border-blue-500/35 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
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






