import React from 'react'
import { formatCurrency, getCategoryIcon } from '../utils/expenseFormatters'

/**
 * Componente de estadísticas de gastos
 */
const ExpenseStats = ({ calculations }) => {
  const statCard = 'rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3'
  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-lg font-bold text-zinc-100 mb-3">Gastos</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className={`${statCard} ring-1 ring-rose-500/15`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💰</span>
            <span className="text-xs font-medium text-zinc-400">Total</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-rose-200 break-words leading-tight">
            {formatCurrency(calculations.totalAmount)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {calculations.totalTransactions} transacciones
          </p>
        </div>

        <div className={`${statCard} ring-1 ring-sky-500/15`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium text-zinc-400">Promedio</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-sky-200 break-words leading-tight">
            {formatCurrency(calculations.averageAmount)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Por transacción</p>
        </div>

        <div className={`${statCard} ring-1 ring-amber-500/15`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏆</span>
            <span className="text-xs font-medium text-zinc-400">Más Gastado</span>
          </div>
          <p className="text-sm font-bold text-zinc-100 truncate">
            {calculations.topCategory ? (
              <>
                {getCategoryIcon(calculations.topCategory.name)} {calculations.topCategory.name}
              </>
            ) : 'N/A'}
          </p>
          <p className="text-xs text-amber-300 mt-1 break-words">
            {calculations.topCategory ? formatCurrency(calculations.topCategory.total) : ''}
          </p>
        </div>

        <div className={`${statCard} ring-1 ring-emerald-500/15`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📉</span>
            <span className="text-xs font-medium text-zinc-400">Menos Gastado</span>
          </div>
          <p className="text-sm font-bold text-zinc-100 truncate">
            {calculations.lowestCategory ? (
              <>
                {getCategoryIcon(calculations.lowestCategory.name)} {calculations.lowestCategory.name}
              </>
            ) : 'N/A'}
          </p>
          <p className="text-xs text-emerald-300 mt-1 break-words">
            {calculations.lowestCategory ? formatCurrency(calculations.lowestCategory.total) : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExpenseStats
