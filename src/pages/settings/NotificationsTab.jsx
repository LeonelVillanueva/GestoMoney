import React from 'react'

export default function NotificationsTab({ settings, onSettingChange }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🔔 Configuración de Notificaciones</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Notificaciones</div>
              <div className="text-sm text-gray-600">Activar notificaciones del sistema</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notifications} onChange={(e) => onSettingChange('notifications', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Sonido de notificaciones</div>
              <div className="text-sm text-gray-600">Reproducir sonido al mostrar notificaciones</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.notificationSound} onChange={(e) => onSettingChange('notificationSound', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de recordatorios</label>
            <select value={settings.reminderFrequency} onChange={(e) => onSettingChange('reminderFrequency', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="never">Nunca</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duración de notificaciones (segundos)</label>
            <select value={settings.notificationDuration} onChange={(e) => onSettingChange('notificationDuration', parseInt(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value={2000}>2 segundos</option>
              <option value={4000}>4 segundos</option>
              <option value={6000}>6 segundos</option>
              <option value={8000}>8 segundos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de notificaciones simultáneas</label>
            <select value={settings.maxNotifications} onChange={(e) => onSettingChange('maxNotifications', parseInt(e.target.value))} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value={3}>3 notificaciones</option>
              <option value={5}>5 notificaciones</option>
              <option value={8}>8 notificaciones</option>
              <option value={10}>10 notificaciones</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}






