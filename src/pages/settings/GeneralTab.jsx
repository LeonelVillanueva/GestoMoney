import React from 'react'

export default function GeneralTab({ settings, onSettingChange }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">💱 Configuración de Monedas</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tasa de Cambio USD → LPS</label>
            <div className="flex space-x-4">
              <input
                type="number"
                value={settings.exchangeRate || ''}
                onChange={(e) => onSettingChange('exchangeRate', parseFloat(e.target.value))}
                step="0.01"
                min="0"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="26.18"
              />
              <div className="flex items-center text-gray-600">
                <span className="text-sm">$1 USD = L {settings.exchangeRate} LPS</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Moneda por Defecto</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => onSettingChange('defaultCurrency', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="LPS">LPS (Lempiras)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🔧 Comportamiento</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Guardado automático</div>
              <div className="text-sm text-gray-600">Guarda automáticamente los cambios</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => onSettingChange('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}






