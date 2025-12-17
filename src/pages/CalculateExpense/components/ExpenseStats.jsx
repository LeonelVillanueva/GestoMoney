import React from 'react'
import { formatCurrency, getCategoryIcon } from '../utils/expenseFormatters'

/**
 * Componente de estadísticas de gastos
 */
const ExpenseStats = ({ calculations }) => {
  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">💰 Gastos</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-3 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💰</span>
            <span className="text-xs font-medium text-gray-600">Total</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-gray-800 break-words leading-tight">
            {formatCurrency(calculations.totalAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {calculations.totalTransactions} transacciones
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium text-gray-600">Promedio</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-gray-800 break-words leading-tight">
            {formatCurrency(calculations.averageAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Por transacción</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏆</span>
            <span className="text-xs font-medium text-gray-600">Más Gastado</span>
          </div>
          <p className="text-sm font-bold text-gray-800 truncate">
            {calculations.topCategory ? (
              <>
                {getCategoryIcon(calculations.topCategory.name)} {calculations.topCategory.name}
              </>
            ) : 'N/A'}
          </p>
          <p className="text-xs text-gray-600 mt-1 break-words">
            {calculations.topCategory ? formatCurrency(calculations.topCategory.total) : ''}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📉</span>
            <span className="text-xs font-medium text-gray-600">Menos Gastado</span>
          </div>
          <p className="text-sm font-bold text-gray-800 truncate">
            {calculations.lowestCategory ? (
              <>
                {getCategoryIcon(calculations.lowestCategory.name)} {calculations.lowestCategory.name}
              </>
            ) : 'N/A'}
          </p>
          <p className="text-xs text-gray-600 mt-1 break-words">
            {calculations.lowestCategory ? formatCurrency(calculations.lowestCategory.total) : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExpenseStats
