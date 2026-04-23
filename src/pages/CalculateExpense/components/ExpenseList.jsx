import React from 'react'
import { formatCurrency, getCategoryIcon, formatDate } from '../utils/expenseFormatters'

/**
 * Componente de lista de gastos filtrados
 */
const ExpenseList = ({ filteredExpenses, showExpenseList, onToggleExpenseList }) => {
  if (filteredExpenses.length === 0) {
    return (
      <div className="glass-card rounded-xl p-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">No hay gastos en este período</h3>
          <p className="text-xs text-zinc-500">Intenta con un rango de fechas diferente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-zinc-100">
          📝 Gastos ({filteredExpenses.length})
        </h3>
        <button
          onClick={onToggleExpenseList}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          {showExpenseList ? 'Ocultar lista' : 'Ver lista'}
        </button>
      </div>
      {showExpenseList && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredExpenses.map((expense, index) => (
            <div key={expense.id || index} className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/60 transition-colors text-sm">
              <div className="flex items-center gap-2">
                <span className="text-base">{getCategoryIcon(expense.categoria_nombre)}</span>
                <div>
                  <p className="font-medium text-zinc-100">{expense.descripcion}</p>
                    <p className="text-xs text-zinc-500">{expense.categoria_nombre} • {formatDate(expense.fecha)}</p>
                </div>
              </div>
              <p className="font-bold text-zinc-100">{formatCurrency(expense.monto)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExpenseList
