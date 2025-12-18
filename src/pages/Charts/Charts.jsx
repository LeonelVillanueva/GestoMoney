import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import database from '../../database/index.js'
import notifications from '../../utils/services/notifications'
import { useChartFilters } from './hooks/useChartFilters'
import { useChartData } from './hooks/useChartData'
import { useQuarterlyData } from './hooks/useQuarterlyData'
import { useYearFilter } from '../../hooks/useYearFilter'
import YearSelector from '../../components/YearSelector'
import ChartFilters from './components/ChartFilters'
import DistributionCharts from './components/DistributionCharts'
import TrendsChart from './components/TrendsChart'
import QuarterlyAnalysis from './components/QuarterlyAnalysis'
import { formatCurrency } from './utils/chartFormatters'
import { createChartOptions, createBarOptions, createLineOptions } from './utils/chartOptions'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, zoomPlugin)

const Charts = ({ expenses, onDataAdded }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [activeChart, setActiveChart] = useState('distribution') // 'distribution', 'trends', 'quarters'

  // Hook para filtro de año principal
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

  // Hooks personalizados - usar datos filtrados por año
  const {
    filters,
    filteredExpenses,
    gastos,
    ingresos,
    handleFilterChange,
    clearFilters
  } = useChartFilters(expensesByYear)

  const {
    chartData,
    hasData
  } = useChartData(filteredExpenses, gastos, ingresos, filters)

  const quarterlyData = useQuarterlyData(expensesByYear, filters.year)

  // Opciones de gráficos
  const chartOptions = useMemo(() => createChartOptions(), [])
  const barOptions = useMemo(() => createBarOptions(), [])
  const lineOptions = useMemo(() => createLineOptions(), [])

  // Escuchar cambios en los datos desde otras ventanas
  const handleDataChange = useCallback((event) => {
    if (onDataAdded) {
      onDataAdded()
    }
  }, [onDataAdded])

  useEffect(() => {
    window.addEventListener('gastosDataChanged', handleDataChange)
    return () => {
      window.removeEventListener('gastosDataChanged', handleDataChange)
    }
  }, [handleDataChange])

  // Función para agregar datos de prueba
  const addSampleData = async () => {
    try {
      const getOrCreateCategory = async (categoryName) => {
        const categories = await database.getCategories()
        const existingCategory = categories.find(
          cat => cat.nombre && cat.nombre.trim().toLowerCase() === categoryName.trim().toLowerCase()
        )
        
        if (existingCategory) {
          return existingCategory.id
        } else {
          return await database.createCategory({
            nombre: categoryName,
            descripcion: `Categoría: ${categoryName}`
          })
        }
      }

      const sampleExpenses = [
        { 
          fecha: '2024-01-15', 
          monto: 150.00, 
          categoria_id: await getOrCreateCategory('Comida'), 
          descripcion: 'Almuerzo',
          es_entrada: false,
          moneda_original: 'LPS'
        },
        { 
          fecha: '2024-01-16', 
          monto: 75.50, 
          categoria_id: await getOrCreateCategory('Transporte'), 
          descripcion: 'Taxi',
          es_entrada: false,
          moneda_original: 'LPS'
        },
        { 
          fecha: '2024-01-17', 
          monto: 200.00, 
          categoria_id: await getOrCreateCategory('Entretenimiento'), 
          descripcion: 'Cine',
          es_entrada: false,
          moneda_original: 'LPS'
        },
        { 
          fecha: '2024-01-18', 
          monto: 300.00, 
          categoria_id: await getOrCreateCategory('Comida'), 
          descripcion: 'Supermercado',
          es_entrada: false,
          moneda_original: 'LPS'
        },
        { 
          fecha: '2024-01-19', 
          monto: 45.00, 
          categoria_id: await getOrCreateCategory('Transporte'), 
          descripcion: 'Bus',
          es_entrada: false,
          moneda_original: 'LPS'
        }
      ]

      for (const expense of sampleExpenses) {
        await database.createExpense(expense)
      }

      notifications.showSync('✅ Datos de prueba agregados correctamente', 'success')
      
      if (onDataAdded) {
        onDataAdded()
      }
    } catch (error) {
      console.error('Error adding sample data:', error)
      notifications.showSync('❌ Error al agregar datos de prueba', 'error')
    }
  }

  // Calcular estadísticas (de datos filtrados por año)
  const totalGastos = useMemo(() => {
    return gastos.reduce((sum, exp) => {
      const amount = parseFloat(exp.monto)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }, [gastos])

  const totalIngresos = useMemo(() => {
    return ingresos.reduce((sum, exp) => {
      const amount = parseFloat(exp.monto)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
  }, [ingresos])

  const totalNeto = totalIngresos - totalGastos

  if (!hasData && expensesByYear.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
        {/* Header Compacto */}
        <div className="glass-card rounded-xl p-4">
          <h2 className="text-2xl font-bold text-slate-800">📈 Gráficos y Análisis</h2>
          <p className="text-sm text-slate-500 mt-1">Visualiza tus patrones de gasto con gráficos interactivos</p>
        </div>

        {/* Selector de Año */}
        <YearSelector
          yearFilter={yearFilter}
          selectedYear={selectedYear}
          currentYear={currentYear}
          previousYears={previousYears}
          availableYears={availableYears}
          onFilterChange={handleYearFilterChange}
          showStats={true}
          statsByYear={statsByYear}
        />

        {/* Estado Vacío Compacto */}
        <div className="glass-card rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No hay datos para mostrar</h3>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            {yearFilter !== 'all' 
              ? `No hay gastos registrados para ${filterLabel}. Prueba seleccionando otro período.`
              : 'Comienza agregando algunos gastos para ver gráficos y análisis detallados.'}
          </p>
          <div className="flex justify-center gap-4">
            {yearFilter !== 'all' && (
              <button 
                onClick={() => handleYearFilterChange('all')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
              >
                📊 Ver todos los años
              </button>
            )}
            <button 
              onClick={addSampleData}
              className="gradient-button text-white px-4 py-2 rounded-lg text-sm hover:scale-105 transition-transform"
            >
              🧪 Datos de Prueba
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">📈 Gráficos y Análisis</h2>
            <p className="text-sm text-slate-500 mt-1">Visualiza tus patrones de gasto con gráficos interactivos</p>
          </div>
          {yearFilter !== 'all' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
              📅 {filterLabel}
            </span>
          )}
        </div>
      </div>

      {/* Selector de Año */}
      <YearSelector
        yearFilter={yearFilter}
        selectedYear={selectedYear}
        currentYear={currentYear}
        previousYears={previousYears}
        availableYears={availableYears}
        onFilterChange={handleYearFilterChange}
        showStats={true}
        statsByYear={statsByYear}
      />

      {/* Estadísticas Generales Compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">💸</div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">
            Total Gastado {yearFilter !== 'all' && <span className="text-blue-600">({filterLabel})</span>}
          </h4>
          <p className="text-lg font-bold text-red-600">{formatCurrency(totalGastos)}</p>
          <p className="text-xs text-slate-500">{gastos.length} gastos</p>
        </div>

        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">💰</div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">
            Total Ingresos {yearFilter !== 'all' && <span className="text-green-600">({filterLabel})</span>}
          </h4>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
          <p className="text-xs text-slate-500">{ingresos.length} ingresos</p>
        </div>

        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">📊</div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">Balance Neto</h4>
          <p className={`text-lg font-bold ${totalNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalNeto)}
          </p>
          <p className="text-xs text-slate-500">
            {totalNeto >= 0 ? 'Ahorro' : 'Déficit'}
          </p>
        </div>

        <div className="glass-card rounded-xl p-3 text-center">
          <div className="text-2xl mb-1">📝</div>
          <h4 className="text-xs font-medium text-slate-600 mb-1">Transacciones</h4>
          <p className="text-lg font-bold text-slate-600">{expensesByYear.length}</p>
          <p className="text-xs text-slate-500">
            {yearFilter !== 'all' ? `En ${filterLabel}` : 'Registradas'}
          </p>
        </div>
      </div>

      {/* Navegación de Gráficos y Contenido */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setActiveChart('distribution')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'distribution'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Distribución
          </button>
          <button
            onClick={() => setActiveChart('trends')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'trends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📈 Tendencias
          </button>
          <button
            onClick={() => setActiveChart('quarters')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'quarters'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📅 Trimestres
          </button>
        </div>

        {/* Filtros adicionales */}
        <ChartFilters
          filters={filters}
          showFilters={showFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Contenido según gráfico activo */}
        {activeChart === 'distribution' && (
          <DistributionCharts
            chartData={chartData}
            chartOptions={chartOptions}
            barOptions={barOptions}
          />
        )}

        {activeChart === 'trends' && (
          <TrendsChart
            chartData={chartData}
            lineOptions={lineOptions}
            period={filters.period}
          />
        )}

        {activeChart === 'quarters' && quarterlyData && (
          <QuarterlyAnalysis
            quarterlyData={quarterlyData}
            year={filters.year}
            barOptions={barOptions}
          />
        )}
      </div>
    </div>
  )
}

export default Charts
