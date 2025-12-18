import React from 'react'
import { Bar } from 'react-chartjs-2'
import { formatCurrency } from '../utils/chartFormatters'

/**
 * Componente para análisis trimestral
 */
const QuarterlyAnalysis = ({ quarterlyData, year, barOptions }) => {

  if (!quarterlyData) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No hay datos trimestrales</h3>
        <p className="text-gray-500">Selecciona un año con datos</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Análisis Trimestral Compacto */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 mb-3">📅 Análisis Trimestral - {year}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quarterlyData.map((quarter) => (
            <div key={quarter.name} className="bg-gradient-to-br from-gray-50 to-white dark:from-slate-700 dark:to-slate-600 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
              <div className="text-center mb-2">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{quarter.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{quarter.label}</p>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-600">💸</span>
                  <span className="text-xs font-bold text-red-600">{formatCurrency(quarter.gastos)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-green-600">💰</span>
                  <span className="text-xs font-bold text-green-600">{formatCurrency(quarter.ingresos)}</span>
                </div>
                
                <div className="border-t pt-1.5 mt-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">📊</span>
                    <span className={`text-xs font-bold ${quarter.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(quarter.neto)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center pt-1">
                  <span className="text-xs text-slate-400">{quarter.transacciones} trans.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Barras Trimestral Compacto */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">📊 Comparación Trimestral</h3>
        <div className="h-64">
          <Bar 
            data={{
              labels: quarterlyData.map(q => q.name),
              datasets: [
                {
                  label: 'Gastos',
                  data: quarterlyData.map(q => q.gastos),
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  borderColor: '#ef4444',
                  borderWidth: 2
                },
                {
                  label: 'Ingresos',
                  data: quarterlyData.map(q => q.ingresos),
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                  borderColor: '#10b981',
                  borderWidth: 2
                }
              ]
            }}
            options={{
              ...barOptions,
              scales: {
                ...barOptions.scales,
                y: {
                  ...barOptions.scales.y,
                  stacked: false
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default QuarterlyAnalysis
