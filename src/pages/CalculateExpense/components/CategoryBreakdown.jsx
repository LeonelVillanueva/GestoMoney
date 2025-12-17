import React from 'react'
import { formatCurrency, getCategoryIcon } from '../utils/expenseFormatters'

/**
 * Componente de desglose por categoría
 */
const CategoryBreakdown = ({ categoryBreakdown }) => {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return null
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Desglose por Categoría</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Total</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Transacciones</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Promedio</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((category, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getCategoryIcon(category.name)}</span>
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </div>
                </td>
                <td className="text-right py-3 px-4 font-bold text-gray-800">
                  {formatCurrency(category.total)}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {category.count}
                </td>
                <td className="text-right py-3 px-4 text-gray-600">
                  {formatCurrency(category.total / category.count)}
                </td>
                <td className="text-right py-3 px-4">
                  <div className="flex items-center justify-end">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CategoryBreakdown
