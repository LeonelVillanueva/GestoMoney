/**
 * Utilidades para cálculos de presupuestos
 */

/**
 * Calcula análisis de presupuestos
 */
export const calculateBudgetAnalysis = (budgets, expenses, currentMonth) => {
  if (!Array.isArray(expenses) || !Array.isArray(budgets)) {
    return []
  }

  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = expense.fecha?.slice(0, 7)
    return expenseMonth === currentMonth && !expense.es_entrada
  })

  const analysis = budgets.map(budget => {
    const categoryExpenses = currentMonthExpenses.filter(expense => 
      expense.categoria_nombre === budget.category || expense.categoria_id === budget.categoria_id
    )
    
    const spent = categoryExpenses.reduce((sum, expense) => sum + (parseFloat(expense.monto) || 0), 0)
    const remaining = budget.amount - spent
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    const isOverBudget = spent > budget.amount

    return {
      ...budget,
      spent,
      remaining,
      percentage: Math.min(percentage, 100),
      isOverBudget,
      categoryExpenses
    }
  })

  return analysis
}

/**
 * Calcula presupuesto total
 */
export const calculateTotalBudget = (budgets) => {
  if (!Array.isArray(budgets)) return 0
  return budgets.reduce((sum, budget) => sum + (parseFloat(budget.amount) || 0), 0)
}

/**
 * Calcula total gastado
 */
export const calculateTotalSpent = (expenses, currentMonth) => {
  if (!Array.isArray(expenses)) return 0
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = expense.fecha?.slice(0, 7)
    return expenseMonth === currentMonth && !expense.es_entrada
  })
  
  return currentMonthExpenses.reduce((sum, expense) => sum + (parseFloat(expense.monto) || 0), 0)
}

/**
 * Calcula total gastado solo en categorías con presupuesto
 */
export const calculateTotalSpentInBudgetCategories = (expenses, budgets, currentMonth) => {
  if (!Array.isArray(expenses) || !Array.isArray(budgets)) return 0
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = expense.fecha?.slice(0, 7)
    return expenseMonth === currentMonth && !expense.es_entrada
  })

  // Obtener nombres de categorías con presupuesto (normalizados)
  const budgetCategories = new Set()
  budgets.forEach(budget => {
    if (budget.category) {
      // Normalizar el nombre de la categoría para comparación
      budgetCategories.add(budget.category.trim())
    }
  })

  // Filtrar gastos que pertenecen a categorías con presupuesto
  // Comparar tanto por nombre como por ID si existe
  const budgetCategoryExpenses = currentMonthExpenses.filter(expense => {
    const expenseCategoryName = expense.categoria_nombre?.trim()
    const expenseCategoryId = expense.categoria_id
    
    // Comparar por nombre de categoría
    if (expenseCategoryName && budgetCategories.has(expenseCategoryName)) {
      return true
    }
    
    // Si el presupuesto tiene categoria_id, comparar también por ID
    // (aunque actualmente los presupuestos solo usan category como string)
    return false
  })
  
  return budgetCategoryExpenses.reduce((sum, expense) => sum + (parseFloat(expense.monto) || 0), 0)
}

/**
 * Función de depuración: obtiene detalles de gastos por categoría en un mes
 */
export const getExpensesByBudgetCategory = (expenses, budgets, currentMonth) => {
  if (!Array.isArray(expenses) || !Array.isArray(budgets)) return []
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = expense.fecha?.slice(0, 7)
    return expenseMonth === currentMonth && !expense.es_entrada
  })

  return budgets.map(budget => {
    const budgetCategoryName = budget.category?.trim()
    
    const categoryExpenses = currentMonthExpenses.filter(expense => {
      const expenseCategoryName = expense.categoria_nombre?.trim()
      return expenseCategoryName === budgetCategoryName
    })
    
    const total = categoryExpenses.reduce((sum, expense) => sum + (parseFloat(expense.monto) || 0), 0)
    
    return {
      budgetCategory: budgetCategoryName,
      budgetAmount: budget.amount,
      expenses: categoryExpenses,
      totalSpent: total,
      count: categoryExpenses.length
    }
  })
}

/**
 * Obtiene categorías que exceden el presupuesto
 */
export const getOverBudgetCategories = (analysis) => {
  if (!Array.isArray(analysis)) return []
  return analysis.filter(item => item.isOverBudget)
}
