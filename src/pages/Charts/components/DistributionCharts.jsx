import React from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import { formatCurrency } from '../utils/chartFormatters'

/**
 * Componente para gráficos de distribución (Pie y Bar)
 */
const DistributionCharts = ({ chartData, chartOptions, barOptions }) => {
  if (!chartData.pie || !chartData.bar) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-gray-600 mb-2">No hay datos para mostrar</h3>
        <p className="text-gray-500">Intenta ajustar los filtros</p>
      </div>
    )
  }

  return (
    <>
      {/* Gráfico de Torta */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6">🥧 Distribución por Categorías</h3>
        <div className="h-80">
          <Pie data={chartData.pie} options={chartOptions} />
        </div>
      </div>

      {/* Gráfico de Barras */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6">📊 Gastos por Categoría</h3>
        <div className="h-80">
          <Bar data={chartData.bar} options={barOptions} />
        </div>
      </div>
    </>
  )
}

export default DistributionCharts
