import React from 'react'
import { formatCurrency, getCategoryIcon } from '../utils/expenseFormatters'

/**
 * Componente de estadísticas de gastos
 */
const ExpenseStats = ({ calculations }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">💰 Gastos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-slate-600">Total Gastado</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">
            {formatCurrency(calculations.totalAmount)}
          </h3>
          <p className="text-sm text-slate-600">
            {calculations.totalTransactions} transacciones
          </p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-sm text-slate-600">Promedio</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">
            {formatCurrency(calculations.averageAmount)}
          </h3>
          <p className="text-sm text-slate-600">Por transacción</p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">🏆</span>
            </div>
            <span className="text-sm text-slate-600">Más Gastado</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">
            {calculations.topCategory ? (
              <>
                {getCategoryIcon(calculations.topCategory.name)} {calculations.topCategory.name}
              </>
            ) : 'N/A'}
          </h3>
          <p className="text-sm text-slate-600">
            {calculations.topCategory ? formatCurrency(calculations.topCategory.total) : ''}
          </p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">📉</span>
            </div>
            <span className="text-sm text-slate-600">Menos Gastado</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">
            {calculations.lowestCategory ? (
              <>
                {getCategoryIcon(calculations.lowestCategory.name)} {calculations.lowestCategory.name}
              </>
            ) : 'N/A'}
          </h3>
          <p className="text-sm text-slate-600">
            {calculations.lowestCategory ? formatCurrency(calculations.lowestCategory.total) : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExpenseStats
