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
    <div className="space-y-6">
      {/* Análisis Trimestral */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6">📅 Análisis Trimestral - {year}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarterlyData.map((quarter) => (
            <div key={quarter.name} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-slate-800">{quarter.name}</h4>
                <p className="text-sm text-slate-600">{quarter.label}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">💸 Gastos:</span>
                  <span className="font-bold text-red-600">{formatCurrency(quarter.gastos)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">💰 Ingresos:</span>
                  <span className="font-bold text-green-600">{formatCurrency(quarter.ingresos)}</span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">📊 Neto:</span>
                    <span className={`font-bold ${quarter.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(quarter.neto)}
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-xs text-slate-500">{quarter.transacciones} transacciones</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Barras Trimestral */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6">📊 Comparación Trimestral</h3>
        <div className="h-80">
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
