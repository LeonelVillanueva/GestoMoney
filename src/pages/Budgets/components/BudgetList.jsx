import React from 'react'
import { formatCurrency } from '../utils/budgetFormatters'

/**
 * Componente de lista de presupuestos
 */
const BudgetList = ({ 
  analysis, 
  loading, 
  currentMonth, 
  formatDate, 
  onUpdateBudget, 
  onDeleteBudget,
  onRequestEdit,
  onViewDetail
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-zinc-400">Cargando presupuestos...</span>
      </div>
    )
  }

  if (analysis.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-bold text-zinc-400 mb-2">No hay presupuestos configurados</h3>
        <p className="text-gray-500">Crea tu primer presupuesto para comenzar a controlar tus gastos</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {analysis.map((budget) => {
        const remaining = budget.amount - budget.spent
        const hasMultipleCategories = budget.categories && budget.categories.length > 1
        const isClickable = hasMultipleCategories && onViewDetail
        
        return (
          <div 
            key={budget.id} 
            className={`p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/60 transition-colors border border-zinc-700 ${
              isClickable ? 'cursor-pointer' : ''
            }`}
            onClick={isClickable ? () => onViewDetail(budget) : undefined}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2.5 bg-zinc-900 rounded-lg flex-shrink-0 shadow-sm">
                  <span className="text-2xl">{budget.icon || '💰'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-zinc-100 mb-1">
                    {budget.categories && budget.categories.length > 1 
                      ? `💰 ${budget.categories.join(', ')}` 
                      : budget.category}
                  </h4>
                  {hasMultipleCategories && (
                    <p className="text-xs text-blue-600 mb-1 font-medium flex items-center gap-1">
                      <span>👆</span>
                      <span>Presupuesto compartido entre {budget.categories.length} categorías - Click para ver detalle</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Presupuesto:</span>
                      <span className="font-medium text-zinc-100">{formatCurrency(budget.amount)}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Gastado:</span>
                      <span className="font-medium text-zinc-100">{formatCurrency(budget.spent)}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-400">Restante:</span>
                      <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Información de porcentaje y barra */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      budget.isOverBudget ? 'text-red-600' : budget.percentage > 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {budget.percentage.toFixed(1)}%
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      budget.isOverBudget 
                        ? 'bg-red-100 text-red-700' 
                        : budget.percentage > 80 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {budget.isOverBudget ? 'Excedido' : budget.percentage > 80 ? 'Alerta' : 'Bien'}
                    </span>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          budget.isOverBudget ? 'bg-red-500' : budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (onRequestEdit) {
                        onRequestEdit(budget)
                      } else {
                        const newAmount = prompt('Nuevo monto:', budget.amount)
                        if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
                          onUpdateBudget(budget.id, newAmount)
                        }
                      }
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Editar presupuesto"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteBudget(
                      budget.id, 
                      budget.categories && budget.categories.length > 1 
                        ? budget.categories.join(', ') 
                        : budget.category
                    )}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Eliminar presupuesto"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BudgetList
