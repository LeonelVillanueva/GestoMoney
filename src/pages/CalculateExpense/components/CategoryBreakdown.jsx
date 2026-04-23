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
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-lg font-bold text-zinc-100 mb-3">Desglose por categoría</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700">
              <th className="text-left py-2 px-3 font-medium text-zinc-300 text-xs">Categoría</th>
              <th className="text-right py-2 px-3 font-medium text-zinc-300 text-xs">Total</th>
              <th className="text-right py-2 px-3 font-medium text-zinc-300 text-xs">Trans.</th>
              <th className="text-right py-2 px-3 font-medium text-zinc-300 text-xs">Promedio</th>
              <th className="text-right py-2 px-3 font-medium text-zinc-300 text-xs">%</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((category, index) => (
              <tr key={index} className="border-b border-zinc-800/70 hover:bg-zinc-800/50">
                <td className="py-2 px-3">
                  <div className="flex items-center">
                    <span className="text-base mr-2">{getCategoryIcon(category.name)}</span>
                    <span className="font-medium text-zinc-100 text-sm">{category.name}</span>
                  </div>
                </td>
                <td className="text-right py-2 px-3 font-bold text-zinc-100 text-sm">
                  {formatCurrency(category.total)}
                </td>
                <td className="text-right py-2 px-3 text-zinc-400 text-sm">
                  {category.count}
                </td>
                <td className="text-right py-2 px-3 text-zinc-400 text-sm">
                  {formatCurrency(category.total / category.count)}
                </td>
                <td className="text-right py-2 px-3">
                  <div className="flex items-center justify-end">
                    <div className="w-12 bg-zinc-800 rounded-full h-1.5 mr-2">
                      <div 
                        className="h-1.5 rounded-full" 
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-zinc-400 w-10">
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
