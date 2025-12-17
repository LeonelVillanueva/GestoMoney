import React from 'react'
import { formatCurrency, getCategoryIcon, formatDate } from '../utils/expenseFormatters'

/**
 * Componente de lista de gastos filtrados
 */
const ExpenseList = ({ filteredExpenses }) => {
  if (filteredExpenses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No hay gastos en este período</h3>
        <p className="text-gray-500">Intenta con un rango de fechas diferente</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        📝 Gastos en el Período ({filteredExpenses.length} transacciones)
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredExpenses.map((expense, index) => (
          <div key={expense.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white rounded-lg">
                <span className="text-xl">{getCategoryIcon(expense.categoria_nombre)}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{expense.descripcion}</h4>
                <p className="text-sm text-gray-600">{expense.categoria_nombre}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-800">{formatCurrency(expense.monto)}</p>
              <p className="text-sm text-gray-600">{formatDate(expense.fecha)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExpenseList
