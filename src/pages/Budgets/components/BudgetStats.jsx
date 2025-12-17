import React from 'react'
import { formatCurrency, formatDate } from '../utils/budgetFormatters'

/**
 * Componente de estadísticas de presupuestos
 */
const BudgetStats = ({ totalBudget, totalSpent, currentMonth, overBudgetCategories, hasBudgets }) => {
  // Solo calcular porcentaje y restante si hay presupuestos configurados
  const percentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0
  const remaining = totalBudget > 0 ? totalBudget - totalSpent : 0

  // Si no hay presupuestos, mostrar mensaje informativo
  if (!hasBudgets || totalBudget === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">
            No hay presupuestos configurados para {formatDate(currentMonth)}
          </h3>
          <p className="text-sm text-gray-500">
            Crea un presupuesto para comenzar a controlar tus gastos de este mes
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Resumen General - Informativo pero Compacto */}
      <div className="glass-card rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-2xl">💰</span>
              <p className="text-sm font-medium text-gray-600">Presupuesto Total</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1 break-words leading-tight">{formatCurrency(totalBudget)}</p>
            <p className="text-xs text-gray-500">{formatDate(currentMonth)}</p>
          </div>
          <div className="text-center md:text-left border-y md:border-y-0 md:border-x border-gray-200 py-4 md:py-0 px-6">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-2xl">💸</span>
              <p className="text-sm font-medium text-gray-600">Gastado</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-1 break-words leading-tight">{formatCurrency(totalSpent)}</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-semibold text-gray-600">{percentage}%</span>
              <span className="text-xs text-gray-400">del presupuesto</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-2xl">💵</span>
              <p className="text-sm font-medium text-gray-600">Restante</p>
            </div>
            <p className={`text-lg sm:text-xl md:text-2xl font-bold mb-1 break-words leading-tight ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(remaining)}
            </p>
            <p className={`text-xs font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {remaining >= 0 ? '✓ Disponible' : '⚠ Excedido'}
            </p>
          </div>
        </div>
        
        {/* Barra de progreso con información */}
        {totalBudget > 0 && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Progreso del mes</span>
              <span className={`text-xs font-semibold ${
                percentage > 100 ? 'text-red-600' : percentage > 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Alertas de presupuesto excedido - Más Compacto */}
      {overBudgetCategories.length > 0 && (
        <div className="glass-card rounded-xl p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="text-sm font-bold text-red-800">
              {overBudgetCategories.length} {overBudgetCategories.length === 1 ? 'presupuesto excedido' : 'presupuestos excedidos'}
            </h3>
          </div>
          <div className="space-y-2">
            {overBudgetCategories.slice(0, 3).map((category) => (
              <div key={category.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {category.icon} {category.category}
                </span>
                <span className="text-red-600 font-semibold">
                  +{formatCurrency(Math.abs(category.remaining))}
                </span>
              </div>
            ))}
            {overBudgetCategories.length > 3 && (
              <p className="text-xs text-gray-600 mt-2">
                +{overBudgetCategories.length - 3} más...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default BudgetStats
