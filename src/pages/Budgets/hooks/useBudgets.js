import { useState, useEffect, useCallback, useMemo } from 'react'
import database from '../../../database/index.js'
import notifications from '../../../utils/services/notifications'
import { calculateBudgetAnalysis, calculateTotalBudget, calculateTotalSpentInBudgetCategories, getOverBudgetCategories } from '../utils/budgetCalculations'

/**
 * Hook para manejar presupuestos
 */
export const useBudgets = (expenses, currentMonth, onDataChanged) => {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [budgetForm, setBudgetForm] = useState({
    category: '',
    amount: '',
    month: currentMonth
  })

  // Cargar presupuestos
  const loadBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const budgetsData = await database.getBudgets(currentMonth)
      
      if (Array.isArray(budgetsData)) {
        setBudgets(budgetsData)
      } else {
        setBudgets([])
      }
    } catch (error) {
      console.error('Error loading budgets:', error)
      notifications.showSync('Error al cargar presupuestos: ' + error.message, 'error')
      setBudgets([])
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  // Actualizar formulario cuando cambie el mes
  useEffect(() => {
    setBudgetForm(prev => ({ ...prev, month: currentMonth }))
  }, [currentMonth])

  // Crear presupuesto
  const createBudget = useCallback(async (e) => {
    e?.preventDefault()
    
    if (!budgetForm.category || !budgetForm.amount || !budgetForm.month) {
      notifications.showSync('Por favor completa todos los campos', 'error')
      return
    }

    try {
      const budgetData = {
        category: budgetForm.category,
        amount: parseFloat(budgetForm.amount),
        month: budgetForm.month
      }
      
      await database.createBudget(budgetData)
      notifications.showSync('✅ Presupuesto creado exitosamente', 'success')
      setBudgetForm({ category: '', amount: '', month: currentMonth })
      
      if (budgetForm.month === currentMonth) {
        loadBudgets()
      } else {
        // Si es para otro mes, cambiar la vista a ese mes
        // Esto se manejará en el componente padre
      }
      
      if (onDataChanged) {
        onDataChanged()
      }
    } catch (error) {
      console.error('Error creating budget:', error)
      notifications.showSync('❌ Error al crear presupuesto: ' + error.message, 'error')
    }
  }, [budgetForm, currentMonth, loadBudgets, onDataChanged])

  // Actualizar presupuesto
  const updateBudget = useCallback(async (budgetId, newAmount) => {
    try {
      await database.updateBudget(budgetId, { amount: parseFloat(newAmount) })
      notifications.showSync('✅ Presupuesto actualizado', 'success')
      loadBudgets()
    } catch (error) {
      console.error('Error updating budget:', error)
      notifications.showSync('❌ Error al actualizar presupuesto', 'error')
    }
  }, [loadBudgets])

  // Eliminar presupuesto
  const deleteBudget = useCallback(async (budgetId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      return
    }

    try {
      await database.deleteBudget(budgetId)
      notifications.showSync('✅ Presupuesto eliminado', 'success')
      loadBudgets()
    } catch (error) {
      console.error('Error deleting budget:', error)
      notifications.showSync('❌ Error al eliminar presupuesto', 'error')
    }
  }, [loadBudgets])

  // Calcular análisis
  const analysis = useMemo(() => {
    return calculateBudgetAnalysis(budgets, expenses, currentMonth)
  }, [budgets, expenses, currentMonth])

  const totalBudget = useMemo(() => {
    return calculateTotalBudget(budgets)
  }, [budgets])

  const totalSpent = useMemo(() => {
    // Solo contar gastos de categorías que tienen presupuesto
    return calculateTotalSpentInBudgetCategories(expenses, budgets, currentMonth)
  }, [expenses, budgets, currentMonth])

  const overBudgetCategories = useMemo(() => {
    return getOverBudgetCategories(analysis)
  }, [analysis])

  return {
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
    deleteBudget,
    loadBudgets
  }
}
