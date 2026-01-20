/**
 * Utilidades para cálculos de presupuestos
 */

/**
 * Calcula análisis de presupuestos
 * Soporta presupuestos con múltiples categorías (separadas por "|")
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
    // Obtener las categorías del presupuesto (pueden ser múltiples separadas por "|")
    const budgetCategories = String(budget.category || '').split('|').map(c => c.trim()).filter(c => c)
    
    // Filtrar gastos que pertenecen a cualquiera de las categorías del presupuesto
    const categoryExpenses = currentMonthExpenses.filter(expense => {
      const expenseCategoryName = String(expense.categoria_nombre || '').trim()
      const expenseCategoryId = expense.categoria_id
      
      // Verificar si la categoría del gasto está en las categorías del presupuesto
      return budgetCategories.some(budgetCat => {
        // Comparar por nombre
        if (expenseCategoryName && expenseCategoryName.toLowerCase() === budgetCat.toLowerCase()) {
          return true
        }
        // Comparar por ID si está disponible
        if (expenseCategoryId && String(budgetCat).toLowerCase() === String(expenseCategoryId).toLowerCase()) {
          return true
        }
        return false
      })
    })
    
    // Sumar todos los gastos de las categorías del presupuesto
    const spent = categoryExpenses.reduce((sum, expense) => sum + (parseFloat(expense.monto) || 0), 0)
    const remaining = budget.amount - spent
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    const isOverBudget = spent > budget.amount

    return {
      ...budget,
      categories: budgetCategories, // Array de categorías para fácil acceso
      category: budgetCategories.join(', '), // String legible para mostrar
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
 * Soporta presupuestos con múltiples categorías (separadas por "|")
 */
export const calculateTotalSpentInBudgetCategories = (expenses, budgets, currentMonth) => {
  if (!Array.isArray(expenses) || !Array.isArray(budgets)) return 0
  
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = expense.fecha?.slice(0, 7)
    return expenseMonth === currentMonth && !expense.es_entrada
  })

  // Obtener todas las categorías con presupuesto (normalizadas, soporta múltiples)
  const budgetCategories = new Set()
  budgets.forEach(budget => {
    if (budget.category) {
      // Dividir por "|" si tiene múltiples categorías
      const categories = String(budget.category).split('|').map(c => c.trim().toLowerCase()).filter(c => c)
      categories.forEach(cat => {
        budgetCategories.add(cat)
      })
    }
  })

  // Filtrar gastos que pertenecen a categorías con presupuesto
  const budgetCategoryExpenses = currentMonthExpenses.filter(expense => {
    const expenseCategoryName = String(expense.categoria_nombre || '').trim().toLowerCase()
    const expenseCategoryId = expense.categoria_id
    
    // Comparar por nombre de categoría
    if (expenseCategoryName && budgetCategories.has(expenseCategoryName)) {
      return true
    }
    
    // Comparar por ID si está disponible
    if (expenseCategoryId && budgetCategories.has(String(expenseCategoryId).toLowerCase())) {
      return true
    }
    
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
