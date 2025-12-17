import React from 'react'

export default function InterfaceTab({ settings, onSettingChange }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🎨 Configuración de Interfaz</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Elementos por página</label>
            <select value={settings.itemsPerPage} onChange={(e) => onSettingChange('itemsPerPage', parseInt(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value={10}>10 elementos</option>
              <option value={25}>25 elementos</option>
              <option value={50}>50 elementos</option>
              <option value={100}>100 elementos</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Mostrar símbolo de moneda</div>
              <div className="text-sm text-gray-600">Mostrar L, $ en los montos</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.showCurrencySymbol} onChange={(e) => onSettingChange('showCurrencySymbol', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formato de fecha</label>
            <select value={settings.dateFormat} onChange={(e) => onSettingChange('dateFormat', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="dd/mm/yyyy">DD/MM/AAAA</option>
              <option value="mm/dd/yyyy">MM/DD/AAAA</option>
              <option value="yyyy-mm-dd">AAAA-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formato de números</label>
            <select value={settings.numberFormat} onChange={(e) => onSettingChange('numberFormat', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="comma">1,234.56 (coma como separador de miles)</option>
              <option value="dot">1.234,56 (punto como separador de miles)</option>
              <option value="space">1 234.56 (espacio como separador de miles)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}






