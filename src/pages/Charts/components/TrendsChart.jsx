import React from 'react'
import { Line } from 'react-chartjs-2'

/**
 * Componente para gráfico de tendencias (Line)
 */
const TrendsChart = ({ chartData, lineOptions, period }) => {
  if (!chartData.line) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No hay datos para mostrar</h3>
        <p className="text-gray-500">Intenta ajustar los filtros</p>
      </div>
    )
  }

  const title = period === 'quarter' || period === 'year' 
    ? 'Tendencias Mensuales' 
    : 'Tendencias Diarias'

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6">📈 {title}</h3>
      <div className="h-80">
        <Line data={chartData.line} options={lineOptions} />
      </div>
    </div>
  )
}

export default TrendsChart
