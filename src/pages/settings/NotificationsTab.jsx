import React from 'react'

export default function NotificationsTab({ settings, onSettingChange }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">🔔 Notificaciones</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Activar notificaciones</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Mostrar notificaciones del sistema</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notifications} onChange={(e) => onSettingChange('notifications', e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 dark:bg-slate-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Sonido</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Reproducir sonido al mostrar notificaciones</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notificationSound} onChange={(e) => onSettingChange('notificationSound', e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-gray-200 dark:bg-slate-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Frecuencia de recordatorios</label>
            <select value={settings.reminderFrequency} onChange={(e) => onSettingChange('reminderFrequency', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100">
              <option value="never">Nunca</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (seg)</label>
              <select value={settings.notificationDuration} onChange={(e) => onSettingChange('notificationDuration', parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100">
                <option value={2000}>2 seg</option>
                <option value={4000}>4 seg</option>
                <option value={6000}>6 seg</option>
                <option value={8000}>8 seg</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Máximo simultáneas</label>
              <select value={settings.maxNotifications} onChange={(e) => onSettingChange('maxNotifications', parseInt(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100">
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






