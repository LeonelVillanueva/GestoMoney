import React from 'react'
import { formatCurrency, getCategoryIcon, formatDate } from '../utils/expenseFormatters'

/**
 * Componente de estadísticas de ingresos
 */
const IncomeStats = ({ incomeCalculations, filteredIncomes }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">💵 Ingresos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat-card rounded-2xl p-6 text-green-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <span className="text-2xl">💵</span>
            </div>
            <span className="text-sm text-green-600">Total Ingresos</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-green-800">
            {formatCurrency(incomeCalculations.totalAmount)}
          </h3>
          <p className="text-sm text-green-600">
            {incomeCalculations.totalTransactions} transacciones
          </p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-green-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-sm text-green-600">Promedio</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-green-800">
            {formatCurrency(incomeCalculations.averageAmount)}
          </h3>
          <p className="text-sm text-green-600">Por transacción</p>
        </div>
      </div>

      {/* Desglose de Ingresos por Categoría */}
      {incomeCalculations.categoryBreakdown.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mt-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Ingresos por Categoría</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Transacciones</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {incomeCalculations.categoryBreakdown.map((category, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{getCategoryIcon(category.name)}</span>
                        <span className="font-medium text-gray-800">{category.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-bold text-green-700">
                      {formatCurrency(category.total)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {category.count}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-600">
                      {formatCurrency(category.total / category.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lista de Ingresos */}
      {filteredIncomes.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mt-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            💵 Ingresos en el Período ({filteredIncomes.length} transacciones)
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredIncomes.map((income, index) => (
              <div key={income.id || index} className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white rounded-lg">
                    <span className="text-xl">{getCategoryIcon(income.categoria_nombre)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{income.descripcion}</h4>
                    <p className="text-sm text-gray-600">{income.categoria_nombre}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">{formatCurrency(income.monto)}</p>
                  <p className="text-sm text-gray-600">{formatDate(income.fecha)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default IncomeStats
