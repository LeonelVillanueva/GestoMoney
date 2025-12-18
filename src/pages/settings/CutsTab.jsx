import React from 'react'

export default function CutsTab({
  cuts,
  newCutType,
  setNewCutType,
  editingCutType,
  setEditingCutType,
  onAddCutType,
  onDeleteCutType,
  onUpdateCutType,
  onRequestEdit,
  settings,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">➕ Agregar Nuevo Tipo</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCutType}
            onChange={(e) => setNewCutType(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            placeholder="Ej: Corte Moderno, Corte Clásico..."
          />
          <button
            onClick={onAddCutType}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">💇 Tipos Disponibles ({settings.defaultCutTypes?.length || 0})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {settings.defaultCutTypes?.map((cutType, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">💇</span>
                  <div className="flex-1 min-w-0">
                    {editingCutType === cutType ? (
                      <input
                        type="text"
                        defaultValue={cutType}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        onBlur={(e) => {
                          if (e.target.value !== cutType) {
                            onUpdateCutType(cutType, e.target.value)
                          } else {
                            setEditingCutType(null)
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') onUpdateCutType(cutType, e.target.value)
                          if (e.key === 'Escape') setEditingCutType(null)
                        }}
                        autoFocus
                      />
                    ) : (
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{cutType}</h4>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => onRequestEdit ? onRequestEdit(cutType) : setEditingCutType(editingCutType === cutType ? null : cutType)} className="text-blue-600 hover:text-blue-800 text-xs">✏️</button>
                  <button onClick={() => onDeleteCutType(cutType)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!settings.defaultCutTypes || settings.defaultCutTypes.length === 0) && (
          <div className="text-center py-6 text-gray-500">
            <span className="text-3xl mb-2 block">💇</span>
            <p className="text-xs">No hay tipos de corte configurados</p>
            <p className="text-xs mt-1">Agrega tu primer tipo usando el formulario</p>
          </div>
        )}
      </div>
    </div>
  )
}






