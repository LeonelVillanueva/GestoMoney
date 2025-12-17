import React from 'react'

export default function GeneralTab({ settings, onSettingChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">💱 Monedas</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tasa de Cambio USD → LPS</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={settings.exchangeRate || ''}
                onChange={(e) => onSettingChange('exchangeRate', parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="26.18"
              />
              <span className="text-xs text-gray-600 whitespace-nowrap">$1 = L {settings.exchangeRate || '0'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Moneda por Defecto</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => onSettingChange('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="LPS">LPS (Lempiras)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">🔧 Comportamiento</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-800">Guardado automático</div>
              <div className="text-xs text-gray-600">Guarda automáticamente los cambios</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => onSettingChange('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}






