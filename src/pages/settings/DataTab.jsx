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
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">💾 Gestión de Datos</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Respaldo automático</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Crear respaldos automáticos</div>
            </div>
            <button
              onClick={() => onSettingChange('respaldo_automatico', (settings.respaldo_automatico || 'true') === 'true' ? 'false' : 'true')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full ${ (settings.respaldo_automatico || 'true') === 'true' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-500' }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${ (settings.respaldo_automatico || 'true') === 'true' ? 'translate-x-5' : 'translate-x-1' }`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Frecuencia de respaldo</label>
              <select
                value={settings.frecuencia_respaldo || 'weekly'}
                onChange={(e) => onSettingChange('frecuencia_respaldo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Retención de datos</label>
              <select
                value={settings.dataRetention || 'forever'}
                onChange={(e) => onSettingChange('dataRetention', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="6months">6 meses</option>
                <option value="1year">1 año</option>
                <option value="2years">2 años</option>
                <option value="forever">Para siempre</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">📦 Respaldo Manual</h3>
        <div className="space-y-2">
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-sm rounded-lg font-medium transition-colors"
          >
            ⬇️ Descargar Backup
          </button>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Restaurar desde backup</label>
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
              className="block w-full text-xs text-gray-700 dark:text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-slate-600 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200 dark:hover:file:bg-slate-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">📸 Snapshots</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={async () => {
                try {
                  await createSnapshot()
                  notifications.showSync('✅ Snapshot creado', 'success', 2000)
                } catch (e) {
                  notifications.showSync('❌ No se pudo crear snapshot', 'error')
                }
              }}
              className="bg-slate-600 hover:bg-slate-700 dark:bg-slate-500 dark:hover:bg-slate-400 text-white px-3 py-2 text-sm rounded-lg font-medium transition-colors"
            >
              📸 Crear
            </button>

            <button
              onClick={async () => {
                try {
                  if (!snapshots || snapshots.length === 0) {
                    notifications.showSync('ℹ️ No hay snapshots disponibles', 'warning', 2000)
                    return
                  }
                  
                  // Confirmación antes de restaurar
                  const confirmMessage = `¿Estás seguro de restaurar el snapshot más reciente?\n\n` +
                    `Esto eliminará TODOS los datos actuales y los reemplazará con los del snapshot.\n\n` +
                    `Se creará un backup de seguridad automático antes de proceder.`
                  
                  if (!window.confirm(confirmMessage)) {
                    return
                  }

                  notifications.showSync('🔄 Validando snapshot y creando backup de seguridad...', 'info', 3000)
                  
                  const result = await restoreLatest()
                  if (result.success) {
                    const countsMsg = result.counts 
                      ? `\nGastos: ${result.counts.current.expenses}, Categorías: ${result.counts.current.categories}, Compras: ${result.counts.current.purchases}, Cortes: ${result.counts.current.cuts}, Presupuestos: ${result.counts.current.budgets}`
                      : ''
                    notifications.showSync(`✅ Snapshot restaurado exitosamente.${countsMsg}\nRecargando...`, 'success', 3000)
                    setTimeout(() => window.location.reload(), 1500)
                  } else {
                    const errorMsg = result.errors && result.errors.length > 0
                      ? result.errors.join('\n')
                      : 'Error desconocido al restaurar snapshot'
                    alert(`❌ Error al restaurar snapshot:\n\n${errorMsg}\n\nLos datos originales fueron restaurados desde el backup de seguridad.`)
                    notifications.showSync('❌ Error al restaurar snapshot', 'error', 5000)
                  }
                } catch (e) {
                  console.error('Error restaurando snapshot:', e)
                  alert(`❌ Error inesperado:\n\n${e.message}`)
                  notifications.showSync('❌ Error al restaurar snapshot', 'error', 5000)
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-sm rounded-lg font-medium transition-colors"
            >
              🧯 Restaurar último
            </button>
          </div>

          <div>
            <h5 className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2">📚 Snapshots guardados ({snapshots.length})</h5>
            {loadingSnapshots ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 py-2">Cargando snapshots...</div>
            ) : snapshots.length === 0 ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 py-2">No hay snapshots guardados todavía.</div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {snapshots.map((snap) => (
                  <div key={snap.id} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg px-2 py-1.5 border border-gray-200 dark:border-slate-600">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs flex-shrink-0">🗂️</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{new Date(snap.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{Math.round((snap.sizeBytes || 0)/1024)} KB · {snap.totalRecords || 0} reg.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            const snapshotDate = new Date(snap.createdAt).toLocaleString()
                            
                            // Confirmación antes de restaurar
                            const confirmMessage = `¿Estás seguro de restaurar este snapshot?\n\n` +
                              `Fecha: ${snapshotDate}\n` +
                              `Tamaño: ${Math.round((snap.sizeBytes || 0)/1024)} KB\n` +
                              `Registros: ${snap.totalRecords || 0}\n\n` +
                              `⚠️ ADVERTENCIA: Esto eliminará TODOS los datos actuales y los reemplazará con los del snapshot.\n\n` +
                              `Se creará un backup de seguridad automático antes de proceder.`
                            
                            if (!window.confirm(confirmMessage)) {
                              return
                            }

                            notifications.showSync('🔄 Validando snapshot y creando backup de seguridad...', 'info', 3000)
                            
                            const result = await restoreById(snap.id)
                            if (result.success) {
                              const countsMsg = result.counts 
                                ? `\nGastos: ${result.counts.current.expenses}, Categorías: ${result.counts.current.categories}, Compras: ${result.counts.current.purchases}, Cortes: ${result.counts.current.cuts}, Presupuestos: ${result.counts.current.budgets}`
                                : ''
                              notifications.showSync(`✅ Snapshot restaurado exitosamente.${countsMsg}\nRecargando...`, 'success', 3000)
                              setTimeout(() => window.location.reload(), 1500)
                            } else {
                              const errorMsg = result.errors && result.errors.length > 0
                                ? result.errors.join('\n')
                                : 'Error desconocido al restaurar snapshot'
                              alert(`❌ Error al restaurar snapshot:\n\n${errorMsg}\n\nLos datos originales fueron restaurados desde el backup de seguridad.`)
                              notifications.showSync('❌ Error al restaurar snapshot', 'error', 5000)
                            }
                          } catch (e) {
                            console.error('Error restaurando snapshot:', e)
                            alert(`❌ Error inesperado:\n\n${e.message}`)
                            notifications.showSync('❌ Error al restaurar snapshot', 'error', 5000)
                          }
                        }}
                        className="text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-xs px-1.5 py-0.5 border border-indigo-200 dark:border-indigo-600 rounded"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => downloadSnapshot(snap)}
                        className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 text-xs px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-600 rounded"
                      >
                        Descargar
                      </button>
                      <button
                        onClick={async () => {
                          await deleteById(snap.id)
                          notifications.showSync('🗑️ Snapshot eliminado', 'warning', 1500)
                        }}
                        className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-xs px-1.5 py-0.5 border border-red-200 dark:border-red-600 rounded"
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
  )
}



