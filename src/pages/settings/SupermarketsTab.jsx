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
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">➕ Agregar Nuevo Supermercado</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newSupermarket}
            onChange={(e) => setNewSupermarket(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: La Colonia, Walmart, Price Smart, Super Selectos..."
          />
          <button
            onClick={onAddSupermarket}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🛒 Supermercados Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.defaultSupermarkets?.map((supermarket, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🛒</span>
                  <div>
                    {editingSupermarket === supermarket ? (
                      <input
                        type="text"
                        defaultValue={supermarket}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                      <h4 className="font-semibold text-gray-800">{supermarket}</h4>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingSupermarket(editingSupermarket === supermarket ? null : supermarket)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">✏️</button>
                  <button onClick={() => onDeleteSupermarket(supermarket)} className="text-red-600 hover:text-red-800 text-sm font-medium">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!settings.defaultSupermarkets || settings.defaultSupermarkets.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">🛒</span>
            <p>No hay supermercados configurados</p>
            <p className="text-sm">Agrega tu primer supermercado usando el formulario de arriba</p>
          </div>
        )}
      </div>
    </div>
  )
}






