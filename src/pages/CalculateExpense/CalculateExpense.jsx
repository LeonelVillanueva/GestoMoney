import React from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
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
  LineElement,
  zoomPlugin
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

  const [showExpenseList, setShowExpenseList] = React.useState(false)
  const [showIncomeList, setShowIncomeList] = React.useState(false)

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🧮 Calcula tu Gasto</h2>
            <p className="text-sm text-gray-500 mt-1">Analiza tus gastos en un rango de fechas específico</p>
          </div>
        </div>
      </div>

      {/* Selector de Fechas Compacto */}
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
          {/* Resumen Compacto - Gastos e Ingresos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpenseStats calculations={calculations} />
            <IncomeStats 
              incomeCalculations={incomeCalculations} 
              filteredIncomes={filteredIncomes}
              showIncomeList={showIncomeList}
              onToggleIncomeList={() => setShowIncomeList(!showIncomeList)}
            />
          </div>

          {/* Gráficos Compactos */}
          <ExpenseCharts
            calculations={calculations}
            chartOptions={chartOptions}
            pieChartOptions={pieChartOptions}
          />

          {/* Tabla Detallada por Categoría Compacta */}
          <CategoryBreakdown categoryBreakdown={calculations.categoryBreakdown} />

          {/* Lista de Gastos Filtrados Colapsable */}
          <ExpenseList 
            filteredExpenses={filteredExpenses}
            showExpenseList={showExpenseList}
            onToggleExpenseList={() => setShowExpenseList(!showExpenseList)}
          />
        </>
      )}
    </div>
  )
}

export default CalculateExpense
