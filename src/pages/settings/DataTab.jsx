import React from 'react'
import useSnapshots from '../../hooks/useSnapshots'
import database from '../../database/index.js'
import notifications from '../../utils/services/notifications'

export default function DataTab({ settings, onSettingChange, active }) {
  const {
    snapshots,
    loadingSnapshots,
    loadSnapshots,
    createSnapshot,
    restoreLatest,
    restoreById,
    deleteById,
    downloadSnapshot,
  } = useSnapshots(active)

  return (
    <div className="space-y-3">
      <div className="glass-card rounded-lg p-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3">💾 Gestión de Datos</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-medium text-gray-700">Respaldo automático</label>
              <p className="text-xs text-gray-500">Crear respaldos automáticos</p>
            </div>
            <button
              onClick={() => onSettingChange('respaldo_automatico', (settings.respaldo_automatico || 'true') === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${ (settings.respaldo_automatico || 'true') === 'true' ? 'bg-blue-600' : 'bg-gray-300' }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${ (settings.respaldo_automatico || 'true') === 'true' ? 'translate-x-6' : 'translate-x-1' }`} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Frecuencia de respaldo</label>
            <select
              value={settings.frecuencia_respaldo || 'weekly'}
              onChange={(e) => onSettingChange('frecuencia_respaldo', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Retención de datos</label>
            <select
              value={settings.dataRetention || 'forever'}
              onChange={(e) => onSettingChange('dataRetention', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="6months">6 meses</option>
              <option value="1year">1 año</option>
              <option value="2years">2 años</option>
              <option value="forever">Para siempre</option>
            </select>
          </div>

          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-800 mb-1.5">📦 Respaldo</h4>
            <button
              onClick={async () => {
                try {
                  const allData = await database.exportAll()
                  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  const ts = new Date().toISOString().replace(/[:.]/g, '-')
                  a.download = `backup-gestor-gastos-${ts}.json`
                  document.body.appendChild(a)
                  a.click()
                  a.remove()
                  URL.revokeObjectURL(url)
                  notifications.showSync('✅ Backup descargado', 'success', 2000)
                } catch (error) {
                  console.error('Error exporting data:', error)
                  notifications.showSync('❌ Error al generar backup', 'error')
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs rounded font-medium transition-colors mb-2"
            >
              ⬇️ Descargar Backup
            </button>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Restaurar desde backup</label>
              <input
                type="file"
                accept="application/json"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const json = JSON.parse(text)
                    const ok = await database.importAll(json)
                    if (ok) {
                      notifications.showSync('✅ Backup restaurado. Recargando...', 'success', 2000)
                      setTimeout(() => window.location.reload(), 800)
                    } else {
                      notifications.showSync('❌ Archivo inválido de backup', 'error')
                    }
                  } catch (err) {
                    console.error('Error importing backup:', err)
                    notifications.showSync('❌ Error al leer el archivo', 'error')
                  } finally {
                    e.target.value = ''
                  }
                }}
                className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>

            <div className="mt-2 grid gap-1.5 md:grid-cols-2">
              <button
                onClick={async () => {
                  try {
                    await createSnapshot()
                    notifications.showSync('✅ Snapshot creado', 'success', 2000)
                  } catch (e) {
                    notifications.showSync('❌ No se pudo crear snapshot', 'error')
                  }
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1.5 text-xs rounded font-medium transition-colors"
              >
                📸 Crear snapshot
              </button>

              <button
                onClick={async () => {
                  try {
                    if (!snapshots || snapshots.length === 0) {
                      notifications.showSync('ℹ️ No hay snapshots disponibles', 'warning', 2000)
                      return
                    }
                    const ok = await restoreLatest()
                    if (ok) {
                      notifications.showSync('✅ Snapshot restaurado. Recargando...', 'success', 2000)
                      setTimeout(() => window.location.reload(), 800)
                    } else {
                      notifications.showSync('❌ No se pudo restaurar snapshot', 'error')
                    }
                  } catch (e) {
                    notifications.showSync('❌ Error al restaurar snapshot', 'error')
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs rounded font-medium transition-colors"
              >
                🧯 Restaurar último
              </button>
            </div>


            <div className="mt-3">
              <h5 className="text-xs font-semibold text-gray-800 mb-1.5">📚 Snapshots guardados</h5>
              {loadingSnapshots ? (
                <div className="text-xs text-gray-500">Cargando snapshots...</div>
              ) : snapshots.length === 0 ? (
                <div className="text-xs text-gray-500">No hay snapshots guardados todavía.</div>
              ) : (
                <div className="space-y-1.5">
                  {snapshots.map((snap) => (
                    <div key={snap.id} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1 border border-gray-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">🗂️</span>
                        <div>
                          <div className="text-xs font-medium text-gray-800">{new Date(snap.createdAt).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{Math.round((snap.sizeBytes || 0)/1024)} KB · {snap.totalRecords || 0} reg.</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => {
                            const ok = await restoreById(snap.id)
                            if (ok) {
                              notifications.showSync('✅ Snapshot restaurado. Recargando...', 'success', 2000)
                              setTimeout(() => window.location.reload(), 800)
                            } else {
                              notifications.showSync('❌ No se pudo restaurar snapshot', 'error')
                            }
                          }}
                          className="text-indigo-700 hover:text-indigo-900 text-xs px-1.5 py-0.5 border border-indigo-200 rounded"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => downloadSnapshot(snap)}
                          className="text-emerald-700 hover:text-emerald-900 text-xs px-1.5 py-0.5 border border-emerald-200 rounded"
                        >
                          Descargar
                        </button>
                        <button
                          onClick={async () => {
                            await deleteById(snap.id)
                            notifications.showSync('🗑️ Snapshot eliminado', 'warning', 1500)
                          }}
                          className="text-red-700 hover:text-red-900 text-xs px-1.5 py-0.5 border border-red-200 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



