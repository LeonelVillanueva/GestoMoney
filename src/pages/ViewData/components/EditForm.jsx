import React from 'react'
import DateInput from '../../../components/DateInput'

/**
 * Componente de formulario de edición reutilizable para ViewData
 */
const EditForm = ({
  editingItem,
  editForm,
  availableCategories,
  cutTypes,
  onFormChange,
  onSave,
  onCancel
}) => {
  if (!editingItem) return null

  const renderFormFields = () => {
    switch (editingItem.type) {
      case 'gastos':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label="📅 Fecha"
                value={editForm.fecha}
                onChange={(fecha) => onFormChange({ fecha })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Monto (LPS)
                </label>
                <input
                  type="number"
                  value={editForm.monto}
                  onChange={(e) => onFormChange({ monto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ Categoría
              </label>
              <select
                value={editForm.categoria_nombre}
                onChange={(e) => onFormChange({ categoria_nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Descripción
              </label>
              <input
                type="text"
                value={editForm.descripcion}
                onChange={(e) => onFormChange({ descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id={`es_entrada_${editingItem.id}`}
                checked={editForm.es_entrada || false}
                onChange={(e) => onFormChange({ es_entrada: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`es_entrada_${editingItem.id}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                💰 Es una entrada de dinero (ingreso)
              </label>
            </div>

            {editForm.moneda_original === 'USD' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">💵</span>
                  <span className="text-sm text-blue-700 font-medium">
                    Este gasto fue registrado originalmente en dólares (USD)
                  </span>
                </div>
              </div>
            )}
          </>
        )

      case 'supermercado':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label="📅 Fecha"
                value={editForm.fecha}
                onChange={(fecha) => onFormChange({ fecha })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Monto (LPS)
                </label>
                <input
                  type="number"
                  value={editForm.monto}
                  onChange={(e) => onFormChange({ monto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏪 Supermercado
              </label>
              <select
                value={editForm.supermercado}
                onChange={(e) => onFormChange({ supermercado: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="La Colonia">🏪 La Colonia</option>
                <option value="Walmart">🏬 Walmart</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Descripción
              </label>
              <input
                type="text"
                value={editForm.descripcion}
                onChange={(e) => onFormChange({ descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </>
        )

      case 'cortes':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label="📅 Fecha"
                value={editForm.fecha}
                onChange={(fecha) => onFormChange({ fecha })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💇 Tipo de Corte
                </label>
                <select
                  value={editForm.tipo_corte}
                  onChange={(e) => onFormChange({ tipo_corte: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {cutTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )

      default:
        return null
    }
  }

  const getTitle = () => {
    switch (editingItem.type) {
      case 'gastos':
        return '✏️ Editando Gasto'
      case 'supermercado':
        return '✏️ Editando Compra'
      case 'cortes':
        return '✏️ Editando Corte'
      default:
        return '✏️ Editando'
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-800 mb-4">{getTitle()}</h4>
      {renderFormFields()}
      <div className="flex space-x-3">
        <button
          onClick={onSave}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          💾 Guardar Cambios
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  )
}

export default EditForm
