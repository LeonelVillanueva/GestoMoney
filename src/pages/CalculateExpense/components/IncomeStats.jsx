import React from 'react'
import { formatCurrency, getCategoryIcon, formatDate } from '../utils/expenseFormatters'

/**
 * Componente de estadísticas de ingresos
 */
const IncomeStats = ({ incomeCalculations, filteredIncomes, showIncomeList, onToggleIncomeList }) => {
  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-lg font-bold text-gray-800 mb-3">💵 Ingresos</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💵</span>
            <span className="text-xs font-medium text-gray-600">Total</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-green-800 break-words leading-tight">
            {formatCurrency(incomeCalculations.totalAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {incomeCalculations.totalTransactions} transacciones
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium text-gray-600">Promedio</span>
          </div>
          <p className="text-base sm:text-lg md:text-xl font-bold text-green-800 break-words leading-tight">
            {formatCurrency(incomeCalculations.averageAmount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Por transacción</p>
        </div>
      </div>

      {/* Desglose de Ingresos por Categoría Compacto */}
      {incomeCalculations.categoryBreakdown.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Por Categoría</h4>
            <button
              onClick={onToggleIncomeList}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showIncomeList ? 'Ocultar lista' : 'Ver lista'}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {incomeCalculations.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getCategoryIcon(category.name)}</span>
                  <span className="font-medium text-gray-800">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-700">{formatCurrency(category.total)}</span>
                  <span className="text-xs text-gray-500 ml-2">({category.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Ingresos Colapsable */}
      {showIncomeList && filteredIncomes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            💵 Ingresos ({filteredIncomes.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredIncomes.map((income, index) => (
              <div key={income.id || index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">{getCategoryIcon(income.categoria_nombre)}</span>
                  <div>
                    <p className="font-medium text-gray-800">{income.descripcion}</p>
                    <p className="text-xs text-gray-500">{formatDate(income.fecha)}</p>
                  </div>
                </div>
                <p className="font-bold text-green-700">{formatCurrency(income.monto)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IncomeStats
