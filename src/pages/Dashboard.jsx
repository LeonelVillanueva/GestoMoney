import React, { useState, useEffect } from 'react'
import database from '../database/index.js'

const Dashboard = ({ expenses, onNavigate, onDataChanged }) => {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalTransactions: 0,
    averageExpense: 0,
    topCategory: 'N/A',
    monthlyTrend: '+0%'
  })

  const [recentExpenses, setRecentExpenses] = useState([])
  const [budgetAlerts, setBudgetAlerts] = useState([])

  useEffect(() => {
    calculateStats()
    checkBudgetAlerts()
  }, [expenses])

  const checkBudgetAlerts = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const budgets = await database.getBudgets(currentMonth)
      
      const currentMonthExpenses = expenses.filter(expense => {
        const expenseMonth = expense.fecha.slice(0, 7)
        return expenseMonth === currentMonth && !expense.es_entrada
      })

      const alerts = budgets.map(budget => {
        const categoryExpenses = currentMonthExpenses.filter(expense => 
          expense.categoria_nombre === budget.category
        )
        
        const spent = categoryExpenses.reduce((sum, expense) => sum + expense.monto, 0)
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        
        return {
          ...budget,
          spent,
          percentage,
          isOverBudget: spent > budget.amount,
          isNearLimit: percentage >= 80 && percentage < 100
        }
      }).filter(alert => alert.isOverBudget || alert.isNearLimit)

      setBudgetAlerts(alerts)
    } catch (error) {
      console.error('Error checking budget alerts:', error)
    }
  }

  // Escuchar cambios en los datos desde otras ventanas
  useEffect(() => {
    const handleDataChange = (event) => {
      // Notificar al componente padre para recargar datos
      if (onDataChanged) {
        onDataChanged()
      }
    }

    // Escuchar eventos de cambio de datos
    window.addEventListener('gastosDataChanged', handleDataChange)

    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener('gastosDataChanged', handleDataChange)
    }
  }, [onDataChanged])

  const calculateStats = () => {
    // Separar gastos e ingresos
    const gastos = expenses.filter(expense => !expense.es_entrada)
    const ingresos = expenses.filter(expense => expense.es_entrada)
    
    // Calcular total de gastos (restar ingresos)
    const totalGastos = gastos.reduce((sum, expense) => sum + expense.monto, 0)
    const totalIngresos = ingresos.reduce((sum, expense) => sum + expense.monto, 0)
    const total = totalGastos - totalIngresos // ✅ Restar ingresos de gastos
    
    const count = expenses.length
    const average = count > 0 ? totalGastos / count : 0

    // Categoría más gastada (solo gastos, no ingresos)
    const categoryTotals = gastos.reduce((acc, expense) => {
      const category = expense.categoria_nombre || 'Otros'
      acc[category] = (acc[category] || 0) + expense.monto
      return acc
    }, {})
    
    const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b, 'N/A'
    )

    setStats({
      totalExpenses: total,
      totalTransactions: count,
      averageExpense: average,
      topCategory,
      monthlyTrend: '+12.5%' // Esto se calculará con datos reales
    })

    setRecentExpenses(expenses.slice(0, 5))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Comida': '🍽️',
      'Transporte': '🚌',
      'Entretenimiento': '🎮',
      'Regalos': '🎁',
      'Utilidades': '⚡',
      'Salud': '🏥',
      'Educación': '📚',
      'Tecnología': '💻',
      'Otros': '📦'
    }
    return icons[category] || '📦'
  }

  const formatDate = (dateString) => {
    // Parsear fecha de manera segura para evitar problemas de zona horaria
    if (!dateString) return ''
    
    // Si es formato YYYY-MM-DD, parsear directamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('es-HN')
    }
    
    // Para otros formatos, usar parsing normal
    return new Date(dateString).toLocaleDateString('es-HN')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📊 Dashboard</h2>
        <p className="text-gray-600">Resumen de tus gastos personales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">💰</span>
            </div>
            <span className="text-sm text-slate-600">Total Gastos</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">{formatCurrency(stats.totalExpenses)}</h3>
          <p className="text-sm text-slate-600">{stats.monthlyTrend} vs mes anterior</p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">📝</span>
            </div>
            <span className="text-sm text-slate-600">Transacciones</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">{stats.totalTransactions}</h3>
          <p className="text-sm text-slate-600">Registros totales</p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-sm text-slate-600">Promedio</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">{formatCurrency(stats.averageExpense)}</h3>
          <p className="text-sm text-slate-600">Por transacción</p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-2xl">🏆</span>
            </div>
            <span className="text-sm text-slate-600">Top Categoría</span>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-slate-800">{getCategoryIcon(stats.topCategory)} {stats.topCategory}</h3>
          <p className="text-sm text-slate-600">Más gastada</p>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-xl font-bold text-gray-800">Alertas de Presupuesto</h3>
          </div>
          <div className="space-y-3">
            {budgetAlerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-xl border-l-4 ${
                alert.isOverBudget 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-yellow-50 border-yellow-400'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getCategoryIcon(alert.category)}</span>
                    <div>
                      <h4 className="font-bold text-gray-800">{alert.category}</h4>
                      <p className="text-sm text-gray-600">
                        {alert.isOverBudget ? 'Presupuesto excedido' : 'Cerca del límite'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      alert.isOverBudget ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {formatCurrency(alert.spent)} / {formatCurrency(alert.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {alert.percentage.toFixed(1)}% del presupuesto
                    </div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      alert.isOverBudget ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button 
              onClick={() => onNavigate('budgets')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todos los presupuestos →
            </button>
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">📋 Gastos Recientes</h3>
          <button 
            onClick={() => onNavigate('charts')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos
          </button>
        </div>

        {recentExpenses.length > 0 ? (
          <div className="space-y-4">
            {recentExpenses.map((expense, index) => (
              <div key={expense.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white rounded-lg">
                    <span className="text-xl">{getCategoryIcon(expense.categoria_nombre)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{expense.descripcion}</h4>
                    <p className="text-sm text-gray-600">{expense.categoria_nombre}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{formatCurrency(expense.monto)}</p>
                  <p className="text-sm text-gray-600">{formatDate(expense.fecha)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">No hay gastos registrados</h3>
            <p className="text-gray-500 mb-6">Comienza agregando tu primer gasto</p>
            <button 
              onClick={() => onNavigate('add-expense')}
              className="gradient-button text-white px-6 py-3 rounded-xl font-medium"
            >
              ➕ Agregar Gasto
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('add-expense')}
            className="gradient-button text-white p-4 rounded-xl text-center hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium">Agregar Gasto</div>
          </button>
          <button 
            onClick={() => onNavigate('charts')}
            className="gradient-button text-white p-4 rounded-xl text-center hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium">Ver Gráficos</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
