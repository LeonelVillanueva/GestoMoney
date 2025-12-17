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
  settings,
}) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">➕ Agregar Nuevo Tipo de Corte</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newCutType}
            onChange={(e) => setNewCutType(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Corte Moderno, Corte Clásico, Corte Degradado..."
          />
          <button
            onClick={onAddCutType}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">💇 Tipos de Corte Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settings.defaultCutTypes?.map((cutType, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💇</span>
                  <div>
                    {editingCutType === cutType ? (
                      <input
                        type="text"
                        defaultValue={cutType}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
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
                      <h4 className="font-semibold text-gray-800">{cutType}</h4>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingCutType(editingCutType === cutType ? null : cutType)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">✏️</button>
                  <button onClick={() => onDeleteCutType(cutType)} className="text-red-600 hover:text-red-800 text-sm font-medium">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!settings.defaultCutTypes || settings.defaultCutTypes.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">💇</span>
            <p>No hay tipos de corte configurados</p>
            <p className="text-sm">Agrega tu primer tipo de corte usando el formulario de arriba</p>
          </div>
        )}
      </div>
    </div>
  )
}






