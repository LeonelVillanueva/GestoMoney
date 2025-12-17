import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import { useDateRange } from './hooks/useDateRange'
import { useExpenseCalculation } from './hooks/useExpenseCalculation'
import DateRangeSelector from './components/DateRangeSelector'
import ExpenseStats from './components/ExpenseStats'
import IncomeStats from './components/IncomeStats'
import CategoryBreakdown from './components/CategoryBreakdown'
import ExpenseCharts from './components/ExpenseCharts'
import ExpenseList from './components/ExpenseList'
import { createChartOptions, createPieChartOptions } from './utils/chartOptions'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const CalculateExpense = ({ expenses, onDataChanged }) => {
  // Hook para rango de fechas
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange()

  // Hook para cálculos
  const {
    filteredExpenses,
    filteredIncomes,
    calculations,
    incomeCalculations,
    isCalculated,
    calculate
  } = useExpenseCalculation(expenses)

  // Opciones de gráficos
  const chartOptions = React.useMemo(() => createChartOptions(), [])
  const pieChartOptions = React.useMemo(() => createPieChartOptions(), [])

  // Manejar cálculo
  const handleCalculate = () => {
    const success = calculate(startDate, endDate)
    if (!success) {
      if (!startDate || !endDate) {
        alert('Por favor selecciona ambas fechas')
      } else {
        alert('La fecha de inicio debe ser anterior a la fecha final')
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🧮 Calcula tu Gasto</h2>
        <p className="text-gray-600">Analiza tus gastos en un rango de fechas específico</p>
      </div>

      {/* Selector de Fechas */}
      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onCalculate={handleCalculate}
      />

      {/* Resultados */}
      {isCalculated && (
        <>
          {/* Resumen de Resultados - Gastos e Ingresos lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseStats calculations={calculations} />
            <IncomeStats 
              incomeCalculations={incomeCalculations} 
              filteredIncomes={filteredIncomes}
            />
          </div>

          {/* Gráficos */}
          <ExpenseCharts
            calculations={calculations}
            chartOptions={chartOptions}
            pieChartOptions={pieChartOptions}
          />

          {/* Tabla Detallada por Categoría */}
          <CategoryBreakdown categoryBreakdown={calculations.categoryBreakdown} />

          {/* Lista de Gastos Filtrados */}
          <ExpenseList filteredExpenses={filteredExpenses} />
        </>
      )}
    </div>
  )
}

export default CalculateExpense
