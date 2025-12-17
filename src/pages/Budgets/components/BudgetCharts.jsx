import React from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { createBarChartOptions, createDoughnutChartOptions } from '../utils/chartOptions'

/**
 * Componente de gráficos de presupuestos
 */
const BudgetCharts = ({ analysis, currentMonth }) => {
  if (!analysis || analysis.length === 0) {
    return null
  }

  const chartData = {
    labels: analysis.map(item => item.category),
    datasets: [
      {
        label: 'Presupuesto',
        data: analysis.map(item => item.amount),
        backgroundColor: analysis.map(item => item.color || '#3b82f6'),
        borderColor: analysis.map(item => item.color || '#3b82f6'),
        borderWidth: 1
      },
      {
        label: 'Gastado',
        data: analysis.map(item => item.spent),
        backgroundColor: analysis.map(item => item.isOverBudget ? '#ef4444' : '#10b981'),
        borderColor: analysis.map(item => item.isOverBudget ? '#ef4444' : '#10b981'),
        borderWidth: 1
      }
    ]
  }

  const doughnutData = {
    labels: analysis.map(item => item.category),
    datasets: [{
      data: analysis.map(item => item.spent),
      backgroundColor: analysis.map(item => item.color || '#3b82f6'),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Presupuesto vs Gastos</h3>
        <div className="h-64">
          <Bar data={chartData} options={createBarChartOptions(currentMonth)} />
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🥧 Distribución</h3>
        <div className="h-64">
          <Doughnut data={doughnutData} options={createDoughnutChartOptions()} />
        </div>
      </div>
    </div>
  )
}

export default BudgetCharts
