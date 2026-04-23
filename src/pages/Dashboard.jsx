import React, { useState, useEffect, useMemo } from 'react'
import database from '../database/index.js'
import { useYearFilter } from '../hooks/useYearFilter'
import { DASH_FONT, I, surfaceApp, surfacePanel } from './Dashboard/shared/dashboardUI'
import { useDashboardLayout, DASHBOARD_LAYOUTS } from './Dashboard/shared/useDashboardLayout'
import DashboardViewSwitcher from './Dashboard/DashboardViewSwitcher'
import DashboardViewHero from './Dashboard/views/DashboardViewHero'
import DashboardViewBento from './Dashboard/views/DashboardViewBento'
import DashboardViewOperations from './Dashboard/views/DashboardViewOperations'

const Dashboard = ({ expenses, onNavigate, onDataChanged }) => {
  const [layout, setLayout] = useDashboardLayout()

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

      const currentMonthExpenses = expensesByYear.filter((expense) => {
        const expenseMonth = expense.fecha.slice(0, 7)
        return expenseMonth === currentMonth && !expense.es_entrada
      })

      const alerts = budgets
        .map((budget) => {
          const categoryExpenses = currentMonthExpenses.filter(
            (expense) => expense.categoria_nombre === budget.category
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
        })
        .filter((alert) => alert.isOverBudget || alert.isNearLimit)

      setBudgetAlerts(alerts)
    } catch (error) {
      console.error('Error checking budget alerts:', error)
    }
  }

  useEffect(() => {
    const handleDataChange = () => {
      if (onDataChanged) {
        onDataChanged()
      }
    }

    window.addEventListener('gastosDataChanged', handleDataChange)
    return () => {
      window.removeEventListener('gastosDataChanged', handleDataChange)
    }
  }, [onDataChanged])

  const calculateStats = () => {
    const gastos = expensesByYear.filter((expense) => !expense.es_entrada)
    const ingresos = expensesByYear.filter((expense) => expense.es_entrada)

    const totalGastos = gastos.reduce((sum, expense) => sum + expense.monto, 0)
    const totalIngresos = ingresos.reduce((sum, expense) => sum + expense.monto, 0)
    const total = totalGastos - totalIngresos

    const count = expensesByYear.length
    const average = count > 0 ? totalGastos / count : 0

    const categoryTotals = gastos.reduce((acc, expense) => {
      const category = expense.categoria_nombre || 'Otros'
      acc[category] = (acc[category] || 0) + expense.monto
      return acc
    }, {})

    const topCategory = Object.keys(categoryTotals).reduce(
      (a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b),
      'N/A'
    )

    setStats({
      totalExpenses: total,
      totalTransactions: count,
      averageExpense: average,
      topCategory,
      monthlyTrend: '+12.5%'
    })

    setRecentExpenses(expensesByYear.slice(0, 5))
  }

  const calculateMonthStats = () => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)

    const currentMonthExpenses = expensesByYear.filter((expense) => {
      const expenseMonth = expense.fecha?.slice(0, 7)
      return expenseMonth === currentMonth && !expense.es_entrada
    })

    const currentMonthIncomes = expensesByYear.filter((expense) => {
      const expenseMonth = expense.fecha?.slice(0, 7)
      return expenseMonth === currentMonth && expense.es_entrada
    })

    const previousMonthExpenses = expensesByYear.filter((expense) => {
      const expenseMonth = expense.fecha?.slice(0, 7)
      return expenseMonth === previousMonth && !expense.es_entrada
    })

    const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.monto, 0)
    const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.monto, 0)
    const currentMonthIncomesTotal = currentMonthIncomes.reduce((sum, expense) => sum + expense.monto, 0)

    const monthlyChange =
      previousMonthTotal > 0
        ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
        : 0

    const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      const category = expense.categoria_nombre || 'Otros'
      acc[category] = (acc[category] || 0) + expense.monto
      return acc
    }, {})

    const topCategories = Object.entries(categoryTotals)
      .map(([name, tot]) => ({ name, total: tot }))
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

  const formatDate = (dateString) => {
    if (!dateString) return ''
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
      return date.toLocaleDateString('es-HN')
    }
    return new Date(dateString).toLocaleDateString('es-HN')
  }

  const allTimeStats = useMemo(() => {
    const gastos = expenses.filter((e) => !e.es_entrada)
    const ingresos = expenses.filter((e) => e.es_entrada)
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
    const yearData = expenses.filter((e) => {
      if (!e.fecha) return false
      return new Date(e.fecha).getFullYear() === currentYear
    })
    const gastos = yearData.filter((e) => !e.es_entrada)
    const ingresos = yearData.filter((e) => e.es_entrada)
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
    const yearData = expenses.filter((e) => {
      if (!e.fecha) return false
      return new Date(e.fecha).getFullYear() < currentYear
    })
    const gastos = yearData.filter((e) => !e.es_entrada)
    const ingresos = yearData.filter((e) => e.es_entrada)
    const totalGastos = gastos.reduce((sum, e) => sum + e.monto, 0)
    const totalIngresos = ingresos.reduce((sum, e) => sum + e.monto, 0)
    return {
      totalGastos,
      totalIngresos,
      balance: totalIngresos - totalGastos,
      count: yearData.length
    }
  }, [expenses, currentYear])

  const kpiDensity = layout === DASHBOARD_LAYOUTS.HERO ? 'default' : 'compact'

  const common = {
    yearFilter,
    selectedYear,
    currentYear,
    previousYears,
    availableYears,
    statsByYear,
    onFilterChange: handleYearFilterChange,
    handleYearFilterChange,
    formatCurrency,
    currentYearStats,
    previousYearsStats,
    allTimeStats,
    stats,
    monthStats,
    filterLabel,
    budgetAlerts,
    onNavigate,
    recentExpenses,
    formatDate,
    kpiDensity
  }

  const viewEl =
    layout === DASHBOARD_LAYOUTS.HERO ? (
      <DashboardViewHero {...common} />
    ) : layout === DASHBOARD_LAYOUTS.BENTO ? (
      <DashboardViewBento {...common} />
    ) : (
      <DashboardViewOperations {...common} />
    )

  return (
    <div
      className='relative min-h-full pb-4 text-zinc-100'
      style={{ fontFamily: DASH_FONT, overflow: 'visible' }}
    >
      <div className={`absolute inset-0 ${surfaceApp}`} aria-hidden />

      <div className='relative mx-auto max-w-7xl pb-4'>
        <div className={`${surfacePanel} space-y-6`}>
          <header className='border-b border-zinc-800/60 pb-5'>
            <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
              <div className='flex items-start gap-3'>
                <div className='mt-0.5 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-900/60 text-zinc-300'>
                  {I.panel('h-6 w-6')}
                </div>
                <div>
                  <p className='text-xs font-medium uppercase tracking-[0.14em] text-zinc-500'>Vista general</p>
                  <h1 className='mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl'>Panel</h1>
                  <p className='mt-1.5 max-w-xl text-sm text-zinc-500'>
                    Ingresos, gastos y tendencias según el periodo que elijas
                  </p>
                </div>
              </div>
              <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3'>
                <DashboardViewSwitcher value={layout} onChange={setLayout} className='w-full sm:w-auto' />
                <button
                  type='button'
                  onClick={() => onNavigate('add-expense')}
                  className='inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-950 sm:w-auto'
                >
                  {I.plus('h-4 w-4 shrink-0')}
                  Agregar gasto
                </button>
              </div>
            </div>
          </header>

          {viewEl}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
