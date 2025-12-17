import React from 'react'

export default function InterfaceTab({ settings, onSettingChange }) {
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
        </div>
      </div>
    </div>
  )
}






