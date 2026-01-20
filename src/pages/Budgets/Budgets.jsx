import React, { useState, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { useBudgets } from './hooks/useBudgets'
import BudgetForm from './components/BudgetForm'
import BudgetList from './components/BudgetList'
import BudgetStats from './components/BudgetStats'
import BudgetCharts from './components/BudgetCharts'
import MonthSelector from './components/MonthSelector'
import BudgetDetailModal from './components/BudgetDetailModal'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
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
  
  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    budgetId: null,
    budgetCategory: ''
  })

  // Estado para el modal de confirmación de edición
  const [editModal, setEditModal] = useState({
    isOpen: false,
    budget: null,
    budgetCategory: ''
  })

  // Estado para el modal de detalle de presupuesto
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    budget: null
  })

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

  // Función para abrir el modal de eliminación
  const openDeleteModal = useCallback((budgetId, budgetCategory) => {
    setDeleteModal({
      isOpen: true,
      budgetId,
      budgetCategory
    })
  }, [])

  // Función para cerrar el modal
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      budgetId: null,
      budgetCategory: ''
    })
  }, [])

  // Función para confirmar la eliminación
  const confirmDelete = useCallback(async () => {
    if (deleteModal.budgetId) {
      await deleteBudget(deleteModal.budgetId, true) // true = skipConfirm
    }
    closeDeleteModal()
  }, [deleteModal.budgetId, deleteBudget, closeDeleteModal])

  // Función para abrir el modal de edición
  const openEditModal = useCallback((budget) => {
    setEditModal({
      isOpen: true,
      budget,
      budgetCategory: budget.categories && budget.categories.length > 1 
        ? budget.categories.join(', ') 
        : budget.category || budget.categoria
    })
  }, [])

  // Función para cerrar el modal de edición
  const closeEditModal = useCallback(() => {
    setEditModal({
      isOpen: false,
      budget: null,
      budgetCategory: ''
    })
  }, [])

  // Función para confirmar la edición (después de PIN verificado)
  const confirmEdit = useCallback(() => {
    if (editModal.budget) {
      const newAmount = prompt('Nuevo monto:', editModal.budget.amount)
      if (newAmount && !isNaN(newAmount) && parseFloat(newAmount) > 0) {
        updateBudget(editModal.budget.id, newAmount)
      }
    }
    closeEditModal()
  }, [editModal.budget, updateBudget, closeEditModal])

  // Función para abrir el modal de detalle
  const openDetailModal = useCallback((budget) => {
    setDetailModal({
      isOpen: true,
      budget
    })
  }, [])

  // Función para cerrar el modal de detalle
  const closeDetailModal = useCallback(() => {
    setDetailModal({
      isOpen: false,
      budget: null
    })
  }, [])

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
          onDeleteBudget={openDeleteModal}
          onRequestEdit={openEditModal}
          onViewDetail={openDetailModal}
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

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="¿Eliminar este presupuesto?"
        message="Esta acción no se puede deshacer."
        itemName={`Presupuesto de ${deleteModal.budgetCategory}`}
      />

      {/* Modal de confirmación de edición */}
      <DeleteConfirmModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        onConfirm={confirmEdit}
        title="¿Editar este presupuesto?"
        message="Ingresa tu PIN para continuar con la edición."
        itemName={`Presupuesto de ${editModal.budgetCategory}`}
        actionType="edit"
      />

      {/* Modal de detalle de presupuesto */}
      <BudgetDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        budget={detailModal.budget}
      />
    </div>
  )
}

export default Budgets
