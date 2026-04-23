import React, { useState, useEffect } from 'react'
import { CATEGORIES } from '../utils/budgetFormatters'

/**
 * Componente de formulario para crear presupuestos
 */
const BudgetForm = ({ budgetForm, onFormChange, onSubmit, currentMonth }) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Convertir category a array si es string (para compatibilidad)
  const selectedCategories = Array.isArray(budgetForm.category) 
    ? budgetForm.category 
    : budgetForm.category ? [budgetForm.category] : []

  const handleCategoryChange = (e) => {
    const options = Array.from(e.target.selectedOptions)
    const values = options.map(option => option.value).filter(v => v)
    onFormChange({ category: values })
  }

  const handleCheckboxChange = (categoryId) => {
    const newCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId]
    onFormChange({ category: newCategories })
  }

  return (
    <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Categorías {isMobile ? '(Toca para seleccionar)' : '(Puedes seleccionar múltiples)'}
            </label>
            
            {/* Versión móvil con checkboxes */}
            {isMobile ? (
              <div className="max-h-64 overflow-y-auto border border-zinc-600 rounded-xl p-3 bg-zinc-900">
                <div className="space-y-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id)
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCheckboxChange(cat.id)}
                          className="w-5 h-5 text-blue-600 border-zinc-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-xl">{cat.icon}</span>
                        <span className={`flex-1 font-medium ${
                          isSelected ? 'text-blue-700' : 'text-zinc-300'
                        }`}>
                          {cat.name}
                        </span>
                        {isSelected && (
                          <span className="text-blue-600">✓</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Versión desktop con select multiple */
              <>
                <select
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples categorías
                </p>
              </>
            )}
            
            {selectedCategories.length > 0 && (
              <p className="text-xs text-blue-600 mt-1 font-medium">
                ✓ {selectedCategories.length} categoría{selectedCategories.length > 1 ? 's' : ''} seleccionada{selectedCategories.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Monto (LPS)
            </label>
            <input
              type="number"
              value={budgetForm.amount}
              onChange={(e) => onFormChange({ amount: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            {selectedCategories.length > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                Este monto se aplicará a cada categoría seleccionada
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Mes
            </label>
            <input
              type="month"
              value={budgetForm.month}
              onChange={(e) => onFormChange({ month: e.target.value })}
              className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
