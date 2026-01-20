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
    category: [], // Cambiar a array para soportar múltiples categorías
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

  // Crear presupuesto(s)
  const createBudget = useCallback(async (e) => {
    e?.preventDefault()
    
    // Validar que todos los campos estén completos
    if (!budgetForm.category || !budgetForm.amount || !budgetForm.month) {
      notifications.showSync('Por favor completa todos los campos', 'error')
      return
    }

    // Normalizar category a array
    let categoriesArray = []
    if (Array.isArray(budgetForm.category)) {
      categoriesArray = budgetForm.category.filter(cat => cat && cat.trim() !== '')
    } else if (budgetForm.category) {
      // Si es string, convertir a array
      const categoryValue = String(budgetForm.category).trim()
      if (categoryValue) {
        categoriesArray = [categoryValue]
      }
    }

    // Validar que haya al menos una categoría
    if (categoriesArray.length === 0) {
      notifications.showSync('Por favor selecciona al menos una categoría', 'error')
      return
    }

    // Validar que amount sea un número válido
    const amountValue = parseFloat(budgetForm.amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      notifications.showSync('Por favor ingresa un monto válido mayor a 0', 'error')
      return
    }

    // Validar formato del mes (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/
    if (!monthRegex.test(budgetForm.month)) {
      notifications.showSync('Formato de mes inválido. Debe ser YYYY-MM', 'error')
      return
    }

    try {
      // Verificar si ya existe un presupuesto que use alguna de estas categorías en ese mes
      const existingBudgets = await database.getBudgets(budgetForm.month)
      
      // Crear un set de todas las categorías que ya tienen presupuesto (separadas por |)
      const existingCategorySet = new Set()
      existingBudgets.forEach(budget => {
        const budgetCategories = String(budget.category || '').split('|').map(c => c.trim().toLowerCase())
        budgetCategories.forEach(cat => {
          if (cat) existingCategorySet.add(cat)
        })
      })

      // Verificar si alguna de las categorías seleccionadas ya tiene presupuesto
      const normalizedSelectedCategories = categoriesArray.map(c => String(c).trim().toLowerCase())
      const conflictingCategories = normalizedSelectedCategories.filter(cat => 
        existingCategorySet.has(cat)
      )

      // Si hay categorías que ya tienen presupuesto, informar al usuario
      if (conflictingCategories.length > 0) {
        notifications.showSync(
          `⚠️ Las siguientes categorías ya tienen presupuesto en ${budgetForm.month}: ${conflictingCategories.join(', ')}. Elimina o edita esos presupuestos primero.`, 
          'warning'
        )
        return
      }

      // Crear UN SOLO presupuesto para TODAS las categorías seleccionadas
      // Unir todas las categorías con un delimitador "|"
      const categoriesString = categoriesArray.join('|')
      
      const budgetData = {
        category: categoriesString,
        amount: amountValue,
        month: budgetForm.month
      }
      
      await database.createBudget(budgetData)
      
      // Mostrar mensaje de éxito
      const categoriesDisplay = categoriesArray.length === 1 
        ? categoriesArray[0] 
        : `${categoriesArray.length} categorías: ${categoriesArray.join(', ')}`
      notifications.showSync(`✅ Presupuesto creado exitosamente para ${categoriesDisplay}`, 'success')
      
      // Limpiar formulario
      setBudgetForm({ category: [], amount: '', month: currentMonth })
      
      // Recargar presupuestos si es para el mes actual
      if (budgetForm.month === currentMonth) {
        loadBudgets()
      }
      
      if (onDataChanged) {
        onDataChanged()
      }
    } catch (error) {
      console.error('Error creating budget:', error)
      let errorMessage = 'Error al crear presupuesto'
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          errorMessage = 'Ya existe un presupuesto para una o más de estas categorías en el mes seleccionado'
        } else if (error.message.includes('violates')) {
          errorMessage = 'Datos inválidos para el presupuesto'
        } else {
          errorMessage = error.message
        }
      }
      notifications.showSync(`❌ ${errorMessage}`, 'error')
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
  // skipConfirm: si es true, no muestra window.confirm (usado cuando ya se confirmó con PIN)
  const deleteBudget = useCallback(async (budgetId, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
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
