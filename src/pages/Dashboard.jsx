import React, { useState, useEffect, useMemo } from 'react'
import database from '../database/index.js'
import YearSelector from '../components/YearSelector'
import { useYearFilter } from '../hooks/useYearFilter'

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
  const [monthStats, setMonthStats] = useState({
    currentMonthTotal: 0,
    previousMonthTotal: 0,
    monthlyChange: 0,
    topCategories: [],
    balance: 0
  })

  // Hook para filtro de año
  const {
    yearFilter,
    selectedYear,
    currentYear,
    availableYears,
    previousYears,
    filterLabel,
    filteredData: expensesByYear,
    statsByYear,
    handleYearFilterChange
  } = useYearFilter(expenses)

  useEffect(() => {
    calculateStats()
    checkBudgetAlerts()
    calculateMonthStats()
  }, [expensesByYear, yearFilter])

  const checkBudgetAlerts = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const budgets = await database.getBudgets(currentMonth)
      
      const currentMonthExpenses = expensesByYear.filter(expense => {
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
    // Separar gastos e ingresos (de los datos filtrados por año)
    const gastos = expensesByYear.filter(expense => !expense.es_entrada)
    const ingresos = expensesByYear.filter(expense => expense.es_entrada)
    
    // Calcular total de gastos (restar ingresos)
    const totalGastos = gastos.reduce((sum, expense) => sum + expense.monto, 0)
    const totalIngresos = ingresos.reduce((sum, expense) => sum + expense.monto, 0)
    const total = totalGastos - totalIngresos // ✅ Restar ingresos de gastos
    
    const count = expensesByYear.length
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

    setRecentExpenses(expensesByYear.slice(0, 5))
  }

  const calculateMonthStats = () => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7) // YYYY-MM
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    
    // Gastos e ingresos del mes actual (de datos filtrados por año)
    const currentMonthExpenses = expensesByYear.filter(expense => {
      const expenseMonth = expense.fecha?.slice(0, 7)
      return expenseMonth === currentMonth && !expense.es_entrada
    })
    
    const currentMonthIncomes = expensesByYear.filter(expense => {
      const expenseMonth = expense.fecha?.slice(0, 7)
      return expenseMonth === currentMonth && expense.es_entrada
    })
    
    // Gastos del mes anterior
    const previousMonthExpenses = expensesByYear.filter(expense => {
      const expenseMonth = expense.fecha?.slice(0, 7)
      return expenseMonth === previousMonth && !expense.es_entrada
    })
    
    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.monto, 0)
    const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.monto, 0)
    const currentMonthIncomesTotal = currentMonthIncomes.reduce((sum, expense) => sum + expense.monto, 0)
    
    const monthlyChange = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0
    
    // Top 3 categorías del mes actual
    const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      const category = expense.categoria_nombre || 'Otros'
      acc[category] = (acc[category] || 0) + expense.monto
      return acc
    }, {})
    
    const topCategories = Object.entries(categoryTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
    
    setMonthStats({
      currentMonthTotal,
      previousMonthTotal,
      monthlyChange,
      topCategories,
      balance: currentMonthIncomesTotal - currentMonthTotal
    })
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

  // Calcular estadísticas de todos los tiempos vs año actual
  const allTimeStats = useMemo(() => {
    const gastos = expenses.filter(e => !e.es_entrada)
    const ingresos = expenses.filter(e => e.es_entrada)
    const totalGastos = gastos.reduce((sum, e) => sum + e.monto, 0)
    const totalIngresos = ingresos.reduce((sum, e) => sum + e.monto, 0)
    return {
      totalGastos,
      totalIngresos,
      balance: totalIngresos - totalGastos,
      count: expenses.length
    }
  }, [expenses])

  const currentYearStats = useMemo(() => {
    const yearData = expenses.filter(e => {
      if (!e.fecha) return false
      return new Date(e.fecha).getFullYear() === currentYear
    })
    const gastos = yearData.filter(e => !e.es_entrada)
    const ingresos = yearData.filter(e => e.es_entrada)
    const totalGastos = gastos.reduce((sum, e) => sum + e.monto, 0)
    const totalIngresos = ingresos.reduce((sum, e) => sum + e.monto, 0)
    return {
      totalGastos,
      totalIngresos,
      balance: totalIngresos - totalGastos,
      count: yearData.length
    }
  }, [expenses, currentYear])

  const previousYearsStats = useMemo(() => {
    const yearData = expenses.filter(e => {
      if (!e.fecha) return false
      return new Date(e.fecha).getFullYear() < currentYear
    })
    const gastos = yearData.filter(e => !e.es_entrada)
    const ingresos = yearData.filter(e => e.es_entrada)
    const totalGastos = gastos.reduce((sum, e) => sum + e.monto, 0)
    const totalIngresos = ingresos.reduce((sum, e) => sum + e.monto, 0)
    return {
      totalGastos,
      totalIngresos,
      balance: totalIngresos - totalGastos,
      count: yearData.length
    }
  }, [expenses, currentYear])

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in" style={{ position: 'relative', overflow: 'visible' }}>
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📊 Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Resumen de tus gastos personales</p>
          </div>
          <button 
            onClick={() => onNavigate('add-expense')}
            className="gradient-button text-white px-4 py-2 rounded-lg font-medium text-sm hover:scale-105 transition-transform"
          >
            ➕ Agregar Gasto
          </button>
        </div>
      </div>

      {/* Selector de Año Compacto */}
      <div className="glass-card rounded-xl p-4" style={{ position: 'relative', zIndex: window.innerWidth < 768 ? 50 : 1000, overflow: 'visible' }}>
        <YearSelector
          yearFilter={yearFilter}
          selectedYear={selectedYear}
          currentYear={currentYear}
          previousYears={previousYears}
          availableYears={availableYears}
          onFilterChange={handleYearFilterChange}
          showStats={false}
          statsByYear={statsByYear}
          compact={true}
        />
      </div>

      {/* Cards de Comparación por Año */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ position: 'relative', zIndex: 1 }}>
        {/* Año Actual */}
        <div className={`glass-card rounded-xl p-4 border-2 transition-all cursor-pointer hover:shadow-lg ${
          yearFilter === 'current' ? 'border-green-400 bg-green-50/50' : 'border-transparent hover:border-green-200'
        }`}
        onClick={() => handleYearFilterChange('current')}
        style={{ position: 'relative', zIndex: 1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗓️</span>
              <h3 className="text-lg font-bold text-gray-800">{currentYear}</h3>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              Año actual
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gastos:</span>
              <span className="font-bold text-red-600">{formatCurrency(currentYearStats.totalGastos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ingresos:</span>
              <span className="font-bold text-green-600">{formatCurrency(currentYearStats.totalIngresos)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance:</span>
                <span className={`font-bold ${currentYearStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentYearStats.balance)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {currentYearStats.count} transacciones
            </p>
          </div>
        </div>

        {/* Años Anteriores */}
        <div className={`glass-card rounded-xl p-4 border-2 transition-all cursor-pointer hover:shadow-lg ${
          yearFilter === 'previous' ? 'border-purple-400 bg-purple-50/50' : 'border-transparent hover:border-purple-200'
        }`}
        onClick={() => handleYearFilterChange('previous')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h3 className="text-lg font-bold text-gray-800">Anteriores</h3>
            </div>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {previousYears.length} años
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gastos:</span>
              <span className="font-bold text-red-600">{formatCurrency(previousYearsStats.totalGastos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ingresos:</span>
              <span className="font-bold text-green-600">{formatCurrency(previousYearsStats.totalIngresos)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance:</span>
                <span className={`font-bold ${previousYearsStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(previousYearsStats.balance)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {previousYearsStats.count} transacciones
            </p>
          </div>
        </div>

        {/* Total Histórico */}
        <div className={`glass-card rounded-xl p-4 border-2 transition-all cursor-pointer hover:shadow-lg ${
          yearFilter === 'all' ? 'border-blue-400 bg-blue-50/50' : 'border-transparent hover:border-blue-200'
        }`}
        onClick={() => handleYearFilterChange('all')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h3 className="text-lg font-bold text-gray-800">Total</h3>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              Histórico
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Gastos:</span>
              <span className="font-bold text-red-600">{formatCurrency(allTimeStats.totalGastos)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ingresos:</span>
              <span className="font-bold text-green-600">{formatCurrency(allTimeStats.totalIngresos)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance:</span>
                <span className={`font-bold ${allTimeStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(allTimeStats.balance)}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              {allTimeStats.count} transacciones
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards Compactas (datos filtrados) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card rounded-xl p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex-shrink-0">
              <span className="text-xl">💰</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium">
                Total {yearFilter !== 'all' && <span className="text-blue-600">({filterLabel})</span>}
              </p>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 break-words leading-tight">{formatCurrency(stats.totalExpenses)}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">{stats.totalTransactions} transacciones</p>
        </div>

        <div className="stat-card rounded-xl p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex-shrink-0">
              <span className="text-xl">📅</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium">Este Mes</p>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 break-words leading-tight">{formatCurrency(monthStats.currentMonthTotal)}</h3>
            </div>
          </div>
          <p className={`text-xs font-medium ${
            monthStats.monthlyChange >= 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {monthStats.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(monthStats.monthlyChange).toFixed(1)}% vs anterior
          </p>
        </div>

        <div className="stat-card rounded-xl p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-3 mb-2">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              monthStats.balance >= 0 
                ? 'bg-gradient-to-br from-green-100 to-green-200' 
                : 'bg-gradient-to-br from-red-100 to-red-200'
            }`}>
              <span className="text-xl">{monthStats.balance >= 0 ? '✅' : '⚠️'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium">Balance</p>
              <h3 className={`text-base sm:text-lg font-bold break-words leading-tight ${
                monthStats.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(monthStats.balance)}
              </h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">Ingresos - Gastos</p>
        </div>

        <div className="stat-card rounded-xl p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
              <span className="text-xl">🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 font-medium">Top Categoría</p>
              <h3 className="text-lg font-bold text-gray-800 truncate">
                {monthStats.topCategories.length > 0 
                  ? `${getCategoryIcon(monthStats.topCategories[0].name)} ${monthStats.topCategories[0].name}`
                  : 'N/A'
                }
              </h3>
            </div>
          </div>
          <p className="text-xs text-gray-500">Este mes</p>
        </div>
      </div>

      {/* Top Categorías del Mes */}
      {monthStats.topCategories.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">📊 Top Categorías del Mes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {monthStats.topCategories.map((cat, index) => (
              <div key={cat.name} className="p-3 bg-gray-50/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(cat.name)}</span>
                    <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{formatCurrency(cat.total)}</p>
                <p className="text-xs text-gray-500">
                  {((cat.total / monthStats.currentMonthTotal) * 100).toFixed(1)}% del total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layout de 2 columnas: Alertas y Gastos Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Alerts Compactas */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800">Alertas</h3>
            </div>
            {budgetAlerts.length > 0 && (
              <button 
                onClick={() => onNavigate('budgets')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos →
              </button>
            )}
          </div>
          {budgetAlerts.length > 0 ? (
            <div className="space-y-2">
              {budgetAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-3 ${
                  alert.isOverBudget 
                    ? 'bg-red-50/80 border-red-400' 
                    : 'bg-yellow-50/80 border-yellow-400'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCategoryIcon(alert.category)}</span>
                      <span className="font-semibold text-sm text-gray-800">{alert.category}</span>
                    </div>
                    <span className={`text-xs font-bold ${
                      alert.isOverBudget ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {alert.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>{formatCurrency(alert.spent)} / {formatCurrency(alert.amount)}</span>
                    <span>{alert.isOverBudget ? 'Excedido' : 'Cerca del límite'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        alert.isOverBudget ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {budgetAlerts.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{budgetAlerts.length - 3} más alertas
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="text-sm text-gray-500">Sin alertas de presupuesto</p>
            </div>
          )}
        </div>

        {/* Recent Expenses Compactas */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📋</span>
              <h3 className="text-lg font-bold text-gray-800">
                Gastos Recientes
                {yearFilter !== 'all' && <span className="text-sm font-normal text-blue-600 ml-1">({filterLabel})</span>}
              </h3>
            </div>
            {recentExpenses.length > 0 && (
              <button 
                onClick={() => onNavigate('view-data')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos →
              </button>
            )}
          </div>

          {recentExpenses.length > 0 ? (
            <div className="space-y-2">
              {recentExpenses.slice(0, 5).map((expense, index) => (
                <div key={expense.id || index} className="flex items-center justify-between p-2.5 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="p-1.5 bg-white rounded-lg flex-shrink-0">
                      <span className="text-base">{getCategoryIcon(expense.categoria_nombre)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-800 truncate">{expense.descripcion}</h4>
                      <p className="text-xs text-gray-500">{expense.categoria_nombre} • {formatDate(expense.fecha)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`font-bold text-sm ${expense.es_entrada ? 'text-green-600' : 'text-gray-800'}`}>
                      {expense.es_entrada ? '+' : '-'}{formatCurrency(expense.monto)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">📊</span>
              <p className="text-sm text-gray-500 mb-3">
                {yearFilter !== 'all' 
                  ? `No hay gastos registrados en ${filterLabel}` 
                  : 'No hay gastos registrados'}
              </p>
              <button 
                onClick={() => onNavigate('add-expense')}
                className="gradient-button text-white px-4 py-2 rounded-lg text-xs font-medium"
              >
                ➕ Agregar Gasto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Compactas */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => onNavigate('add-expense')}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg hover:from-blue-500/20 hover:to-purple-500/20 transition-all hover:scale-105"
          >
            <span className="text-2xl mb-1">➕</span>
            <span className="text-xs font-medium text-gray-700">Agregar Gasto</span>
          </button>
          <button 
            onClick={() => onNavigate('charts')}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-lg hover:from-green-500/20 hover:to-teal-500/20 transition-all hover:scale-105"
          >
            <span className="text-2xl mb-1">📈</span>
            <span className="text-xs font-medium text-gray-700">Gráficos</span>
          </button>
          <button 
            onClick={() => onNavigate('budgets')}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg hover:from-yellow-500/20 hover:to-orange-500/20 transition-all hover:scale-105"
          >
            <span className="text-2xl mb-1">💰</span>
            <span className="text-xs font-medium text-gray-700">Presupuestos</span>
          </button>
          <button 
            onClick={() => onNavigate('calculate-expense')}
            className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-lg hover:from-pink-500/20 hover:to-red-500/20 transition-all hover:scale-105"
          >
            <span className="text-2xl mb-1">🧮</span>
            <span className="text-xs font-medium text-gray-700">Calcular</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
