import React, { useState, useEffect } from 'react'
import exchangeApiService from '../../utils/services/exchangeApi'

export default function GeneralTab({ settings, onSettingChange }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    loadLastUpdate()
  }, [])

  const loadLastUpdate = async () => {
    const updateDate = await exchangeApiService.getLastUpdateDate()
    setLastUpdate(updateDate)
  }

  const handleManualUpdate = async () => {
    setIsUpdating(true)
    try {
      const newRate = await exchangeApiService.forceUpdate()
      if (newRate) {
        onSettingChange('exchangeRate', newRate)
        await loadLastUpdate()
      }
    } catch (error) {
      console.error('Error actualizando tasa:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">💱 Monedas</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tasa de Cambio USD → HND (Actualizada automáticamente)
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                <span className="font-medium">$1 = L {settings.exchangeRate || '0.00'}</span>
              </div>
              <button
                onClick={handleManualUpdate}
                disabled={isUpdating}
                className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Actualizando...' : '🔄 Actualizar'}
              </button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Última actualización: {formatDate(lastUpdate)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              La tasa se actualiza automáticamente cada 6 horas desde exchangerate-api.com
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda por Defecto</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => onSettingChange('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
              <option value="LPS">LPS (Lempiras)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">🔧 Comportamiento</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Guardado automático</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Guarda automáticamente los cambios</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => onSettingChange('autoSave', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 dark:bg-slate-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">💰 Desglose de Gastos</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alcance del desglose al agregar gasto
            </label>
            <select
              value={settings.expenseBreakdownYearScope || 'current'}
              onChange={(e) => onSettingChange('expenseBreakdownYearScope', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            >
              <option value="current">Solo año actual</option>
              <option value="all">Total histórico</option>
            </select>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Define si el desglose muestra solo los gastos del año actual o todos los gastos históricos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}






