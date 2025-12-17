import React, { useState, useEffect, useMemo } from 'react'
import database from '../../../database/index.js'
import { calculateTotalBudget, calculateTotalSpentInBudgetCategories } from '../utils/budgetCalculations'

/**
 * Componente selector de mes con grid 4x3
 */
const MonthSelector = ({ currentMonth, onMonthChange, expenses = [] }) => {
  const [selectedYear, setSelectedYear] = useState(() => {
    return parseInt(currentMonth.split('-')[0])
  })

  const months = [
    { num: 1, name: 'Enero', short: 'Ene' },
    { num: 2, name: 'Febrero', short: 'Feb' },
    { num: 3, name: 'Marzo', short: 'Mar' },
    { num: 4, name: 'Abril', short: 'Abr' },
    { num: 5, name: 'Mayo', short: 'May' },
    { num: 6, name: 'Junio', short: 'Jun' },
    { num: 7, name: 'Julio', short: 'Jul' },
    { num: 8, name: 'Agosto', short: 'Ago' },
    { num: 9, name: 'Septiembre', short: 'Sep' },
    { num: 10, name: 'Octubre', short: 'Oct' },
    { num: 11, name: 'Noviembre', short: 'Nov' },
    { num: 12, name: 'Diciembre', short: 'Dic' }
  ]

  const currentYear = new Date().getFullYear()
  const currentMonthNum = new Date().getMonth() + 1
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const [year, month] = currentMonth.split('-')
    return { year: parseInt(year), month: parseInt(month) }
  })

  const handleMonthClick = (monthNum) => {
    const newMonth = `${selectedYear}-${String(monthNum).padStart(2, '0')}`
    onMonthChange(newMonth)
    setCurrentYearMonth({ year: selectedYear, month: monthNum })
  }

  const handleYearChange = (direction) => {
    setSelectedYear(prev => prev + direction)
  }

  const handleMonthNavigation = (direction) => {
    const [year, month] = currentMonth.split('-')
    const currentDate = new Date(parseInt(year), parseInt(month) - 1)
    currentDate.setMonth(currentDate.getMonth() + direction)
    
    const newYear = currentDate.getFullYear()
    const newMonth = currentDate.getMonth() + 1
    const newMonthString = `${newYear}-${String(newMonth).padStart(2, '0')}`
    
    setSelectedYear(newYear)
    onMonthChange(newMonthString)
    setCurrentYearMonth({ year: newYear, month: newMonth })
  }
  
  // Sincronizar el año seleccionado cuando cambia currentMonth desde fuera
  React.useEffect(() => {
    const [year] = currentMonth.split('-')
    const yearNum = parseInt(year)
    if (yearNum !== selectedYear) {
      setSelectedYear(yearNum)
    }
    const [y, m] = currentMonth.split('-')
    setCurrentYearMonth({ year: parseInt(y), month: parseInt(m) })
  }, [currentMonth])

  // Manejar scroll de la rueda del ratón para navegar entre meses
  const handleWheel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Detectar dirección del scroll
    const delta = e.deltaY
    
    if (delta > 0) {
      // Scroll hacia abajo = mes siguiente
      handleMonthNavigation(1)
    } else if (delta < 0) {
      // Scroll hacia arriba = mes anterior
      handleMonthNavigation(-1)
    }
  }

  const handleTodayClick = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    setSelectedYear(year)
    const newMonth = `${year}-${String(month).padStart(2, '0')}`
    onMonthChange(newMonth)
    setCurrentYearMonth({ year, month })
  }

  const isCurrentMonth = (monthNum) => {
    return selectedYear === currentYearMonth.year && monthNum === currentYearMonth.month
  }

  const isTodayMonth = (monthNum) => {
    return selectedYear === currentYear && monthNum === currentMonthNum
  }

  // Estado de presupuestos por mes
  const [monthBudgets, setMonthBudgets] = useState({})

  // Cargar presupuestos para todos los meses del año seleccionado
  useEffect(() => {
    const loadBudgetsForYear = async () => {
      const budgetsMap = {}
      
      for (let month = 1; month <= 12; month++) {
        const monthString = `${selectedYear}-${String(month).padStart(2, '0')}`
        try {
          const budgets = await database.getBudgets(monthString)
          if (Array.isArray(budgets)) {
            budgetsMap[monthString] = budgets
          } else {
            budgetsMap[monthString] = []
          }
        } catch (error) {
          console.error(`Error loading budgets for ${monthString}:`, error)
          budgetsMap[monthString] = []
        }
      }
      
      setMonthBudgets(budgetsMap)
    }

    loadBudgetsForYear()
  }, [selectedYear])

  // Calcular el estado del presupuesto para un mes
  const getMonthBudgetStatus = (monthNum) => {
    const monthString = `${selectedYear}-${String(monthNum).padStart(2, '0')}`
    const budgets = monthBudgets[monthString] || []
    
    // Si no hay presupuestos, retornar null (sin color)
    if (!budgets || budgets.length === 0) {
      return null
    }

    // Calcular total de presupuesto y gastado SOLO en categorías con presupuesto
    const totalBudget = calculateTotalBudget(budgets)
    const totalSpent = calculateTotalSpentInBudgetCategories(expenses, budgets, monthString)
    
    if (totalBudget === 0) {
      return null
    }

    const percentage = (totalSpent / totalBudget) * 100

    // Determinar estado
    if (percentage > 100) {
      return 'exceeded' // Rojo - Excedido
    } else if (percentage >= 80) {
      return 'warning' // Amarillo - Cuidado
    } else {
      return 'ok' // Verde - Bien
    }
  }

  // Obtener clases CSS según el estado del presupuesto
  const getBudgetStatusClasses = (monthNum, isSelected, isToday) => {
    if (isSelected) {
      return 'bg-blue-600 text-white shadow-lg scale-105'
    }
    
    if (isToday) {
      const status = getMonthBudgetStatus(monthNum)
      if (status === 'exceeded') {
        return 'bg-red-100 text-red-800 border-2 border-red-400'
      } else if (status === 'warning') {
        return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
      } else if (status === 'ok') {
        return 'bg-green-100 text-green-800 border-2 border-green-400'
      }
      return 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
    }

    const status = getMonthBudgetStatus(monthNum)
    if (status === 'exceeded') {
      return 'bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300'
    } else if (status === 'warning') {
      return 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
    } else if (status === 'ok') {
      return 'bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-300'
    }
    
    return 'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200'
  }

  return (
    <div 
      className="glass-card rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg"
      onWheel={handleWheel}
    >
      {/* Header con navegación de mes y selector de año */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => handleMonthNavigation(-1)}
          className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
          title="Mes anterior"
        >
          <span className="text-xl">←</span>
        </button>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => {
              const year = parseInt(e.target.value) || currentYear
              if (year >= 2000 && year <= 2100) {
                setSelectedYear(year)
                // Mantener el mes actual pero cambiar el año
                const [_, month] = currentMonth.split('-')
                const newMonth = `${year}-${month}`
                onMonthChange(newMonth)
                setCurrentYearMonth({ year, month: parseInt(month) })
              }
            }}
            onBlur={(e) => {
              const year = parseInt(e.target.value) || currentYear
              if (year < 2000) {
                setSelectedYear(2000)
                const [_, month] = currentMonth.split('-')
                const newMonth = `2000-${month}`
                onMonthChange(newMonth)
                setCurrentYearMonth({ year: 2000, month: parseInt(month) })
              } else if (year > 2100) {
                setSelectedYear(2100)
                const [_, month] = currentMonth.split('-')
                const newMonth = `2100-${month}`
                onMonthChange(newMonth)
                setCurrentYearMonth({ year: 2100, month: parseInt(month) })
              }
            }}
            className="w-24 px-3 py-2 text-center text-lg font-bold border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            min="2000"
            max="2100"
            style={{ minWidth: '96px' }}
          />
        </div>
        
        <button
          onClick={() => handleMonthNavigation(1)}
          className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm"
          title="Mes siguiente"
        >
          <span className="text-xl">→</span>
        </button>
      </div>

      {/* Botón Hoy */}
      <div className="mb-4">
        <button
          onClick={handleTodayClick}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          📅 Hoy
        </button>
      </div>

      {/* Grid 4x3 de meses */}
      <div className="grid grid-cols-4 gap-2">
        {months.map((month) => {
          const isSelected = isCurrentMonth(month.num)
          const isToday = isTodayMonth(month.num)
          const status = getMonthBudgetStatus(month.num)
          const statusText = status === 'exceeded' ? 'Excedido' : status === 'warning' ? 'Cuidado' : status === 'ok' ? 'Bien' : 'Sin presupuesto'
          
          return (
            <button
              key={month.num}
              onClick={() => handleMonthClick(month.num)}
              className={`
                p-3 rounded-lg font-medium text-sm transition-all
                ${getBudgetStatusClasses(month.num, isSelected, isToday)}
                hover:scale-105 hover:shadow-md
              `}
              title={`${month.name} ${selectedYear} - ${statusText}`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs opacity-75">{month.short}</span>
                <span className="text-lg font-bold">{month.num}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Indicador del mes seleccionado */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Mes seleccionado</p>
          <p className="text-sm font-semibold text-blue-600">
            {months.find(m => m.num === currentYearMonth.month)?.name} {currentYearMonth.year}
          </p>
        </div>
      </div>
    </div>
  )
}

export default MonthSelector
