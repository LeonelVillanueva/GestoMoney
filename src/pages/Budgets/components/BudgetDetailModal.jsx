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
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">Detalle del Presupuesto</h2>
              {hasMultipleCategories && (
                <p className="text-sm text-zinc-500 mt-0.5">
                  Presupuesto compartido entre {budget.categories.length} categorías
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-zinc-400 transition-colors p-2 hover:bg-zinc-800/60 rounded-lg"
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
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Categorías Incluidas</h3>
            <div className="flex flex-wrap gap-2">
              {budget.categories && budget.categories.length > 0 ? (
                budget.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-zinc-800/80 text-sky-300 rounded-lg text-sm font-medium border border-zinc-700"
                  >
                    {category}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1.5 bg-zinc-800/50 text-zinc-300 rounded-lg text-sm">
                  {budget.category || 'Sin categoría'}
                </span>
              )}
            </div>
          </div>

          {/* Resumen General */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card rounded-lg p-4 border-l-4 border-l-sky-500/60">
              <p className="text-xs text-zinc-500 mb-1">Presupuesto total</p>
              <p className="text-lg font-bold text-sky-300">{formatCurrency(budget.amount)}</p>
            </div>
            <div className="stat-card rounded-lg p-4 border-l-4 border-l-red-500/60">
              <p className="text-xs text-zinc-500 mb-1">Total gastado</p>
              <p className="text-lg font-bold text-red-400">{formatCurrency(budget.spent)}</p>
            </div>
            <div className={`stat-card rounded-lg p-4 border-l-4 ${
              remaining >= 0
                ? 'border-l-emerald-500/60'
                : 'border-l-red-500/60'
            }`}>
              <p className="text-xs text-zinc-500 mb-1">Restante</p>
              <p className={`text-lg font-bold ${
                remaining >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {formatCurrency(remaining)}
              </p>
            </div>
            <div
              className={`stat-card rounded-lg p-4 border-l-4 ${
                budget.isOverBudget
                  ? 'border-l-red-500/60'
                  : budget.percentage > 80
                    ? 'border-l-amber-500/60'
                    : 'border-l-emerald-500/60'
              }`}
            >
              <p className="text-xs text-zinc-500 mb-1">Porcentaje</p>
              <p
                className={`text-lg font-bold ${
                  budget.isOverBudget
                    ? 'text-red-400'
                    : budget.percentage > 80
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                }`}
              >
                {budget.percentage.toFixed(1)}%
              </p>
            </div>
          </div>

          <div>
            <div className="w-full bg-zinc-800 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  budget.isOverBudget
                    ? 'bg-red-500'
                    : budget.percentage > 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(budget.percentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Desglose por Categoría */}
          {hasMultipleCategories && Object.keys(expensesByCategory).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Gastos por Categoría</h3>
              <div className="space-y-3">
                {Object.entries(expensesByCategory).map(([categoryName, data]) => (
                  <div key={categoryName} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-zinc-100">{categoryName}</h4>
                      <span className="text-sm font-bold text-zinc-300">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
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
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                Últimos Gastos ({budget.categoryExpenses.length} total)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {budget.categoryExpenses.slice(0, 10).map((expense, index) => (
                  <div
                    key={expense.id || index}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-100 truncate">
                        {expense.descripcion || 'Sin descripción'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {expense.categoria_nombre} • {new Date(expense.fecha).toLocaleDateString('es-HN')}
                      </p>
                    </div>
                    <div className="ml-3">
                      <p className="font-semibold text-zinc-100">
                        {formatCurrency(expense.monto)}
                      </p>
                    </div>
                  </div>
                ))}
                {budget.categoryExpenses.length > 10 && (
                  <p className="text-xs text-center text-zinc-500 pt-2">
                    Y {budget.categoryExpenses.length - 10} gastos más…
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Si no hay gastos */}
          {(!budget.categoryExpenses || budget.categoryExpenses.length === 0) && (
            <div className="text-center py-8">
              <span className="text-4xl mb-2 block">📭</span>
              <p className="text-zinc-500">No hay gastos registrados en este presupuesto</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-zinc-950/80 border-t border-zinc-800 px-6 py-4 flex justify-end backdrop-blur-sm">
          <button
            onClick={onClose}
            type="button"
            className="px-6 py-2 rounded-lg border border-zinc-600 bg-zinc-800/60 text-zinc-200 font-medium hover:bg-zinc-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default BudgetDetailModal

