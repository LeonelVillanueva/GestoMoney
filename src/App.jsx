import React, { useState, useEffect, Suspense, lazy } from 'react'
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { useAppShellEntrance } from './hooks/useAppShellEntrance'
import database from './database/index.js'
import currencyConverter from './utils/services/currency'
import settingsManager from './utils/services/settings'
import notifications from './utils/services/notifications'
import supabasePingService from './utils/services/supabasePing'
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

// Carga perezosa: solo ocupa el área principal
const LoadingFallback = () => (
  <div className="flex min-h-[50vh] w-full flex-col items-center justify-center py-16">
    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
    <p className="text-sm font-medium text-zinc-400">Cargando sección…</p>
  </div>
)

const MainDataLoader = () => (
  <div className="app-main-loader flex min-h-[min(60vh,520px)] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-16">
    <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
    <p className="text-center text-base font-medium text-zinc-300">Cargando tu gestor de gastos…</p>
    <p className="text-center text-xs text-zinc-500">Sincronizando gastos y preferencias</p>
  </div>
)

// Componente interno que maneja las rutas
function AppContent() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [queueStatus, setQueueStatus] = useState({ pending: 0, isOnline: true, processing: false })
  const navigate = useNavigate()
  const location = useLocation()
  const { shellEntranceTick } = useAuth()
  const shellPhase = useAppShellEntrance(shellEntranceTick)

  // Aplicar zoom en móvil
  useEffect(() => {
    const applyMobileZoom = () => {
      const isMobile = window.innerWidth < 768
      if (isMobile) {
        const savedZoom = settingsManager.get('mobileZoom', 100)
        document.documentElement.style.zoom = savedZoom / 100
      } else {
        document.documentElement.style.zoom = '1'
      }
    }

    applyMobileZoom()
    window.addEventListener('resize', applyMobileZoom)
    return () => window.removeEventListener('resize', applyMobileZoom)
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    initializeApp()
  }, [])

  // Iniciar servicio de ping para mantener Supabase activo
  useEffect(() => {
    // Esperar a que la base de datos esté inicializada antes de iniciar el ping
    const initPingService = async () => {
      try {
        await database.init()
        // Iniciar el servicio de ping después de que la DB esté lista
        supabasePingService.start()
      } catch (error) {
        logger.error('Error al inicializar servicio de ping:', error)
      }
    }

    initPingService()

    // Limpiar al desmontar
    return () => {
      supabasePingService.stop()
    }
  }, [])

  const refreshExpenses = async () => {
    const expensesData = await database.getExpenses()
    setExpenses(expensesData || [])
  }

  const initializeApp = async () => {
    try {
      await database.init()

      const exchangeApiService = await import('./utils/services/exchangeApi.js')
      const exchangeRate = await exchangeApiService.default.getExchangeRate()
      currencyConverter.setExchangeRate('USD', 'LPS', exchangeRate)
      exchangeApiService.default.startAutoUpdate()

      await refreshExpenses()
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

  useEffect(() => {
    const unsubscribe = database.subscribeMutationQueue((status) => {
      setQueueStatus(status)
      if (status.pending === 0 && status.isOnline) {
        refreshExpenses().catch(() => {})
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      database.flushMutationQueue().catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleDataChanged = async (payload = {}) => {
    const scope = payload.scope || 'expenses'
    if (scope === 'expenses') {
      await refreshExpenses()
    }
  }

  const handleNavigation = (page) => {
    navigate(`/${page}`)
  }

  // Obtener la página actual desde la URL
  const currentPage = location.pathname.substring(1) || 'dashboard'

  const shellRootClass =
    shellPhase === 'enter'
      ? 'app-shell-root app-shell-root--entering'
      : shellPhase === 'settled' && shellEntranceTick > 0
        ? 'app-shell-root app-shell-root--settled'
        : 'app-shell-root'

  return (
    <ProtectedRoute>
      <div
        className={`${shellRootClass} relative flex min-h-screen w-full min-w-0 flex-col bg-zinc-950 text-zinc-100 md:flex-row`}
        style={{ minWidth: '100vw' }}
      >
        <div data-app-shell="sidebar" className="shrink-0 self-stretch">
          <Sidebar currentPage={currentPage} onNavigate={handleNavigation} />
        </div>
        <main
          data-app-shell="main"
          className="app-shell-main min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6"
        >
          <div
            className="app-shell-content-layer mx-auto w-full max-w-7xl"
            data-app-shell="content"
          >
            {queueStatus.pending > 0 && (
              <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {queueStatus.isOnline
                  ? `Sincronizando ${queueStatus.pending} cambio(s) pendientes...`
                  : `Sin conexión: ${queueStatus.pending} cambio(s) pendientes de sincronizar.`}
              </div>
            )}
            {loading ? (
              <MainDataLoader />
            ) : (
              <div className="app-routes-reveal">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Dashboard expenses={expenses} onNavigate={handleNavigation} onDataChanged={handleDataChanged} />} />
                    <Route path="/dashboard" element={<Dashboard expenses={expenses} onNavigate={handleNavigation} onDataChanged={handleDataChanged} />} />
                    <Route path="/add-expense" element={<AddExpense onExpenseAdded={handleDataChanged} />} />
                    <Route path="/calculate-expense" element={<CalculateExpense expenses={expenses} onDataChanged={handleDataChanged} />} />
                    <Route path="/budgets" element={<Budgets expenses={expenses} onDataChanged={handleDataChanged} />} />
                    <Route path="/supermarket" element={<Supermarket onDataAdded={handleDataChanged} />} />
                    <Route path="/cuts" element={<Cuts onDataAdded={handleDataChanged} />} />
                    <Route path="/view-data" element={<ViewData onDataChanged={handleDataChanged} />} />
                    <Route path="/charts" element={<Charts expenses={expenses} onDataAdded={handleDataChanged} />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Dashboard expenses={expenses} onNavigate={handleNavigation} onDataChanged={handleDataChanged} />} />
                  </Routes>
                </Suspense>
              </div>
            )}
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
        <SpeedInsights />
      </Router>
    </AuthProvider>
  )
}

export default App
