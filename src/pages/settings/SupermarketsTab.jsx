import React from 'react'

export default function SupermarketsTab({
  settings,
  newSupermarket,
  setNewSupermarket,
  editingSupermarket,
  setEditingSupermarket,
  onAddSupermarket,
  onDeleteSupermarket,
  onUpdateSupermarket,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">➕ Agregar Nuevo Supermercado</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSupermarket}
            onChange={(e) => setNewSupermarket(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            placeholder="Ej: La Colonia, Walmart..."
          />
          <button
            onClick={onAddSupermarket}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">🛒 Supermercados ({settings.defaultSupermarkets?.length || 0})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {settings.defaultSupermarkets?.map((supermarket, index) => (
            <div key={index} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">🛒</span>
                  <div className="flex-1 min-w-0">
                    {editingSupermarket === supermarket ? (
                      <input
                        type="text"
                        defaultValue={supermarket}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        onBlur={(e) => {
                          if (e.target.value !== supermarket) {
                            onUpdateSupermarket(supermarket, e.target.value)
                          } else {
                            setEditingSupermarket(null)
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') onUpdateSupermarket(supermarket, e.target.value)
                          if (e.key === 'Escape') setEditingSupermarket(null)
                        }}
                        autoFocus
                      />
                    ) : (
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{supermarket}</h4>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditingSupermarket(editingSupermarket === supermarket ? null : supermarket)} className="text-blue-600 hover:text-blue-800 text-xs">✏️</button>
                  <button onClick={() => onDeleteSupermarket(supermarket)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!settings.defaultSupermarkets || settings.defaultSupermarkets.length === 0) && (
          <div className="text-center py-6 text-gray-500">
            <span className="text-3xl mb-2 block">🛒</span>
            <p className="text-xs">No hay supermercados configurados</p>
            <p className="text-xs mt-1">Agrega tu primer supermercado usando el formulario</p>
          </div>
        )}
      </div>
    </div>
  )
}






