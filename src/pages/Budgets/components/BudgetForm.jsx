import React from 'react'
import { CATEGORIES } from '../utils/budgetFormatters'

/**
 * Componente de formulario para crear presupuestos
 */
const BudgetForm = ({ budgetForm, onFormChange, onSubmit, currentMonth }) => {
  return (
    <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={budgetForm.category}
              onChange={(e) => onFormChange({ category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto (LPS)
            </label>
            <input
              type="number"
              value={budgetForm.amount}
              onChange={(e) => onFormChange({ amount: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <input
              type="month"
              value={budgetForm.month}
              onChange={(e) => onFormChange({ month: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full gradient-button text-white py-2.5 rounded-lg font-medium text-sm"
        >
          💾 Crear Presupuesto
        </button>
      </form>
  )
}

export default BudgetForm
