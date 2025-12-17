import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js'
import database from '../../database/index.js'
import notifications from '../../utils/services/notifications'
import { useChartFilters } from './hooks/useChartFilters'
import { useChartData } from './hooks/useChartData'
import { useQuarterlyData } from './hooks/useQuarterlyData'
import ChartFilters from './components/ChartFilters'
import DistributionCharts from './components/DistributionCharts'
import TrendsChart from './components/TrendsChart'
import QuarterlyAnalysis from './components/QuarterlyAnalysis'
import { formatCurrency } from './utils/chartFormatters'
import { createChartOptions, createBarOptions, createLineOptions } from './utils/chartOptions'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement)

const Charts = ({ expenses, onDataAdded }) => {
  const [showFilters, setShowFilters] = useState(false)
  const [activeChart, setActiveChart] = useState('distribution') // 'distribution', 'trends', 'quarters'

  // Hooks personalizados
  const {
    filters,
    filteredExpenses,
    gastos,
    ingresos,
    handleFilterChange,
    clearFilters
  } = useChartFilters(expenses)

  const {
    chartData,
    hasData
  } = useChartData(filteredExpenses, gastos, ingresos, filters)

  const quarterlyData = useQuarterlyData(expenses, filters.year)

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

  // Calcular estadísticas
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

  if (!hasData) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">📈 Gráficos y Análisis</h2>
          <p className="text-slate-600">Visualiza tus patrones de gasto con gráficos interactivos</p>
        </div>

        {/* Estado Vacío */}
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="text-8xl mb-6">📊</div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">No hay datos para mostrar</h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Comienza agregando algunos gastos para ver gráficos y análisis detallados de tus patrones de gasto.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4 text-slate-500">
              <span className="text-2xl">📈</span>
              <span>Gráficos de distribución por categorías</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-slate-500">
              <span className="text-2xl">📊</span>
              <span>Análisis de tendencias temporales</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-slate-500">
              <span className="text-2xl">💰</span>
              <span>Estadísticas detalladas</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <button 
              onClick={addSampleData}
              className="gradient-button text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity"
            >
              <div className="text-2xl mb-2">🧪</div>
              <div className="font-medium">Datos de Prueba</div>
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="gradient-button text-white p-4 rounded-xl text-center hover:opacity-90 transition-opacity"
            >
              <div className="text-2xl mb-2">{showFilters ? '🔽' : '🔧'}</div>
              <div className="font-medium">{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">📈 Gráficos y Análisis</h2>
        <p className="text-slate-600">Visualiza tus patrones de gasto con gráficos interactivos</p>
      </div>

      {/* Navegación de Gráficos */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveChart('distribution')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeChart === 'distribution'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Distribución
          </button>
          <button
            onClick={() => setActiveChart('trends')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeChart === 'trends'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📈 Tendencias
          </button>
          <button
            onClick={() => setActiveChart('quarters')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeChart === 'quarters'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📅 Trimestres
          </button>
        </div>

        {/* Filtros */}
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

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">💸</div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Total Gastado</h4>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalGastos)}</p>
          <p className="text-sm text-slate-500">{gastos.length} gastos</p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Total Ingresos</h4>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIngresos)}</p>
          <p className="text-sm text-slate-500">{ingresos.length} ingresos</p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Balance Neto</h4>
          <p className={`text-2xl font-bold ${totalNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalNeto)}
          </p>
          <p className="text-sm text-slate-500">
            {totalNeto >= 0 ? 'Ahorro' : 'Déficit'}
          </p>
        </div>

        <div className="stat-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">Total Transacciones</h4>
          <p className="text-2xl font-bold text-slate-600">{expenses.length}</p>
          <p className="text-sm text-slate-500">Registradas</p>
        </div>
      </div>
    </div>
  )
}

export default Charts
