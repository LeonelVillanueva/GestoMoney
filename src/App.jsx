import React, { useState, useEffect, Suspense, lazy } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import database from './database/index.js'
import currencyConverter from './utils/services/currency'
import settingsManager from './utils/services/settings'
import notifications from './utils/services/notifications'
import logger from './utils/logger'

// Lazy-load de componentes de páginas (mejora el rendimiento inicial)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AddExpense = lazy(() => import('./pages/AddExpense'))
const CalculateExpense = lazy(() => import('./pages/CalculateExpense/CalculateExpense'))
const Budgets = lazy(() => import('./pages/Budgets/Budgets'))
const Supermarket = lazy(() => import('./pages/Supermarket'))
const Cuts = lazy(() => import('./pages/Cuts'))
const ViewData = lazy(() => import('./pages/ViewData/ViewData'))
const Charts = lazy(() => import('./pages/Charts/Charts'))
const Settings = lazy(() => import('./pages/Settings'))

// Componente de carga para Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-700 text-xl font-medium">Cargando...</p>
    </div>
  </div>
)

// Componente interno que maneja las rutas
function AppContent() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Initialize database
      await database.init()
      
      // Load exchange rate from database settings
      const savedRate = await database.getConfig('tasa_cambio_usd')
      const exchangeRate = savedRate ? parseFloat(savedRate) : 26.18
      currencyConverter.setExchangeRate('USD', 'LPS', exchangeRate)
      
      // Load expenses from database
      const expensesData = await database.getExpenses()
      setExpenses(expensesData || [])
      
      setLoading(false)
    } catch (error) {
      logger.error('❌ Error loading data:', error)
      logger.error('Error stack:', error.stack)
      // Asegurar que la app se renderice incluso si hay error
      setExpenses([])
      setLoading(false)
      // Intentar mostrar notificación solo si está disponible
      try {
        notifications.showSync('Error al cargar los datos', 'error')
      } catch (notifError) {
        logger.error('Error al mostrar notificación:', notifError)
      }
    }
  }

  const handleNavigation = (page) => {
    navigate(`/${page}`)
  }

  // Obtener la página actual desde la URL
  const currentPage = location.pathname.substring(1) || 'dashboard'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">Cargando Gestor de Gastos...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col md:flex-row">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigation} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Dashboard expenses={expenses} onNavigate={handleNavigation} onDataChanged={loadInitialData} />} />
                <Route path="/dashboard" element={<Dashboard expenses={expenses} onNavigate={handleNavigation} onDataChanged={loadInitialData} />} />
                <Route path="/add-expense" element={<AddExpense onExpenseAdded={loadInitialData} />} />
                <Route path="/calculate-expense" element={<CalculateExpense expenses={expenses} onDataChanged={loadInitialData} />} />
                <Route path="/budgets" element={<Budgets expenses={expenses} onDataChanged={loadInitialData} />} />
                <Route path="/supermarket" element={<Supermarket onDataAdded={loadInitialData} />} />
                <Route path="/cuts" element={<Cuts onDataAdded={loadInitialData} />} />
                <Route path="/view-data" element={<ViewData onDataChanged={loadInitialData} />} />
                <Route path="/charts" element={<Charts expenses={expenses} onDataAdded={loadInitialData} />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Dashboard expenses={expenses} onNavigate={handleNavigation} onDataChanged={loadInitialData} />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// Componente principal con Router
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
