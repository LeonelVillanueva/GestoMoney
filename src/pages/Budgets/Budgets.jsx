import React, { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { useBudgets } from './hooks/useBudgets'
import BudgetForm from './components/BudgetForm'
import BudgetList from './components/BudgetList'
import BudgetStats from './components/BudgetStats'
import BudgetCharts from './components/BudgetCharts'
import MonthSelector from './components/MonthSelector'
import { formatDate } from './utils/budgetFormatters'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Budgets = ({ expenses, onDataChanged }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [showForm, setShowForm] = useState(false)
  const [showCharts, setShowCharts] = useState(false)

  const {
    budgets,
    loading,
    editingBudget,
    setEditingBudget,
    budgetForm,
    setBudgetForm,
    analysis,
    totalBudget,
    totalSpent,
    overBudgetCategories,
    createBudget,
    updateBudget,
    deleteBudget
  } = useBudgets(expenses, currentMonth, onDataChanged)

  const handleFormChange = (updates) => {
    setBudgetForm(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createBudget(e)
    setShowForm(false)
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Contenido Principal */}
        <div className="flex-1 space-y-4">
          {/* Header Compacto */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">💰 Presupuestos</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Mostrando: <span className="font-semibold text-blue-600">{formatDate(currentMonth)}</span>
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showForm 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'gradient-button text-white hover:scale-105'
                }`}
              >
                {showForm ? '✕ Cancelar' : '+ Nuevo Presupuesto'}
              </button>
            </div>
          </div>

      {/* Estadísticas Compactas */}
      <BudgetStats
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        currentMonth={currentMonth}
        overBudgetCategories={overBudgetCategories}
        hasBudgets={budgets.length > 0}
      />

      {/* Formulario Colapsable */}
      {showForm && (
        <div className="glass-card rounded-xl p-5 border-2 border-blue-200">
          <BudgetForm
            budgetForm={budgetForm}
            onFormChange={handleFormChange}
            onSubmit={handleSubmit}
            currentMonth={currentMonth}
          />
        </div>
      )}

      {/* Lista de Presupuestos */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            Presupuestos ({analysis.length})
          </h3>
          {analysis.length > 0 && (
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showCharts ? '📊 Ocultar gráficos' : '📊 Ver gráficos'}
            </button>
          )}
        </div>
        <BudgetList
          analysis={analysis}
          loading={loading}
          currentMonth={currentMonth}
          formatDate={formatDate}
          onUpdateBudget={updateBudget}
          onDeleteBudget={deleteBudget}
        />
      </div>

          {/* Gráficos Colapsables */}
          {showCharts && analysis.length > 0 && (
            <BudgetCharts analysis={analysis} currentMonth={currentMonth} />
          )}
        </div>

        {/* Selector de Mes - A la Derecha */}
        <div className="lg:w-80 flex-shrink-0">
          <MonthSelector 
            currentMonth={currentMonth} 
            onMonthChange={setCurrentMonth}
            expenses={expenses}
          />
        </div>
      </div>
    </div>
  )
}

export default Budgets
