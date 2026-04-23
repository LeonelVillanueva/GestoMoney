import React from 'react'
import { formatCurrency, getCategoryIcon, formatDate } from '../utils/expenseFormatters'

/**
 * Componente de estadísticas de ingresos
 */
const IncomeStats = ({ incomeCalculations, filteredIncomes, showIncomeList, onToggleIncomeList }) => {
  const statCard = 'rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3'

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-lg font-bold text-zinc-100 mb-3">Ingresos</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className={`${statCard} ring-1 ring-emerald-500/15`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💵</span>
            <span className="text-xs font-medium text-zinc-400">Total</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-200 break-words leading-tight">
            {formatCurrency(incomeCalculations.totalAmount)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {incomeCalculations.totalTransactions} transacciones
          </p>
        </div>

        <div className={`${statCard} ring-1 ring-sky-500/15`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium text-zinc-400">Promedio</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-sky-200 break-words leading-tight">
            {formatCurrency(incomeCalculations.averageAmount)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Por transacción</p>
        </div>
      </div>

      {/* Desglose de Ingresos por Categoría Compacto */}
      {incomeCalculations.categoryBreakdown.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-zinc-300">Por Categoría</h4>
            <button
              onClick={onToggleIncomeList}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              {showIncomeList ? 'Ocultar lista' : 'Ver lista'}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {incomeCalculations.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-zinc-900/45 rounded-lg border border-zinc-800/80 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getCategoryIcon(category.name)}</span>
                  <span className="font-medium text-zinc-100">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-300">{formatCurrency(category.total)}</span>
                  <span className="text-xs text-zinc-500 ml-2">({category.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Ingresos Colapsable */}
      {showIncomeList && filteredIncomes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">
            💵 Ingresos ({filteredIncomes.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredIncomes.map((income, index) => (
              <div key={income.id || index} className="flex items-center justify-between p-2 bg-zinc-900/45 rounded-lg border border-zinc-800/80 hover:bg-zinc-800/60 transition-colors text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getCategoryIcon(income.categoria_nombre)}</span>
                  <div>
                    <p className="font-medium text-zinc-100">{income.descripcion}</p>
                    <p className="text-xs text-zinc-500">{formatDate(income.fecha)}</p>
                  </div>
                </div>
                <p className="font-bold text-emerald-300">{formatCurrency(income.monto)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IncomeStats
