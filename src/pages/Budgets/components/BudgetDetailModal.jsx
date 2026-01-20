import React from 'react'
import { formatCurrency } from '../utils/budgetFormatters'

/**
 * Modal para mostrar detalles de un presupuesto combinado
 */
const BudgetDetailModal = ({ isOpen, onClose, budget }) => {
  if (!isOpen || !budget) return null

  const remaining = budget.amount - budget.spent
  const hasMultipleCategories = budget.categories && budget.categories.length > 1

  // Calcular gastos por categoría
  const expensesByCategory = {}
  if (budget.categoryExpenses && Array.isArray(budget.categoryExpenses)) {
    budget.categoryExpenses.forEach(expense => {
      const categoryName = expense.categoria_nombre || 'Sin categoría'
      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = {
          total: 0,
          count: 0,
          expenses: []
        }
      }
      expensesByCategory[categoryName].total += parseFloat(expense.monto) || 0
      expensesByCategory[categoryName].count++
      expensesByCategory[categoryName].expenses.push(expense)
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Detalle del Presupuesto</h2>
              {hasMultipleCategories && (
                <p className="text-sm text-gray-500 mt-0.5">
                  Presupuesto compartido entre {budget.categories.length} categorías
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Categorías */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categorías Incluidas</h3>
            <div className="flex flex-wrap gap-2">
              {budget.categories && budget.categories.length > 0 ? (
                budget.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                  >
                    {category}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm">
                  {budget.category || 'Sin categoría'}
                </span>
              )}
            </div>
          </div>

          {/* Resumen General */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-gray-600 mb-1">Presupuesto Total</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(budget.amount)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-xs text-gray-600 mb-1">Total Gastado</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(budget.spent)}</p>
            </div>
            <div className={`rounded-lg p-4 border ${
              remaining >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-xs text-gray-600 mb-1">Restante</p>
              <p className={`text-lg font-bold ${
                remaining >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {formatCurrency(remaining)}
              </p>
            </div>
            <div className={`rounded-lg p-4 border ${
              budget.isOverBudget 
                ? 'bg-red-50 border-red-200' 
                : budget.percentage > 80 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <p className="text-xs text-gray-600 mb-1">Porcentaje</p>
              <p className={`text-lg font-bold ${
                budget.isOverBudget 
                  ? 'text-red-700' 
                  : budget.percentage > 80 
                  ? 'text-yellow-700' 
                  : 'text-green-700'
              }`}>
                {budget.percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  budget.isOverBudget ? 'bg-red-500' : budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Desglose por Categoría */}
          {hasMultipleCategories && Object.keys(expensesByCategory).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Gastos por Categoría</h3>
              <div className="space-y-3">
                {Object.entries(expensesByCategory).map(([categoryName, data]) => (
                  <div key={categoryName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">{categoryName}</h4>
                      <span className="text-sm font-bold text-gray-700">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {data.count} gasto{data.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Gastos (últimos 10) */}
          {budget.categoryExpenses && budget.categoryExpenses.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Últimos Gastos ({budget.categoryExpenses.length} total)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {budget.categoryExpenses.slice(0, 10).map((expense, index) => (
                  <div
                    key={expense.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {expense.descripcion || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {expense.categoria_nombre} • {new Date(expense.fecha).toLocaleDateString('es-HN')}
                      </p>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(expense.monto)}
                      </p>
                    </div>
                  </div>
                ))}
                {budget.categoryExpenses.length > 10 && (
                  <p className="text-xs text-center text-gray-500 pt-2">
                    Y {budget.categoryExpenses.length - 10} gastos más...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Si no hay gastos */}
          {(!budget.categoryExpenses || budget.categoryExpenses.length === 0) && (
            <div className="text-center py-8">
              <span className="text-4xl mb-2 block">📭</span>
              <p className="text-gray-500">No hay gastos registrados en este presupuesto</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default BudgetDetailModal

