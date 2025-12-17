import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import notifications from '../utils/services/notifications'
import logger from '../utils/logger'

const Sidebar = ({ currentPage, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [expandedGroups, setExpandedGroups] = useState({
    main: true,
    analysis: true,
    tracking: true
  })
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }, [location.pathname, isMobile])

  const handleLogout = async () => {
    try {
      await logout()
      notifications.showSync('Sesión cerrada correctamente', 'success')
    } catch (error) {
      logger.error('Error al cerrar sesión:', error)
      notifications.showSync('Error al cerrar sesión', 'error')
    }
  }

  const handleNavigate = (path) => {
    navigate(path)
    if (isMobile) {
      setIsMobileMenuOpen(false)
    }
  }
  
  const menuGroups = [
    {
      id: 'main',
      label: 'Principal',
      icon: '🏠',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
        { id: 'add-expense', label: 'Agregar Gasto', icon: '➕', path: '/add-expense' },
      ]
    },
    {
      id: 'analysis',
      label: 'Análisis',
      icon: '📊',
      items: [
        { id: 'calculate-expense', label: 'Calcula tu Gasto', icon: '🧮', path: '/calculate-expense' },
        { id: 'budgets', label: 'Presupuestos', icon: '💰', path: '/budgets' },
        { id: 'charts', label: 'Gráficos', icon: '📈', path: '/charts' },
      ]
    },
    {
      id: 'tracking',
      label: 'Seguimiento',
      icon: '📝',
      items: [
        { id: 'supermarket', label: 'Supermercado', icon: '🛒', path: '/supermarket' },
        { id: 'cuts', label: 'Cortes', icon: '💇', path: '/cuts' },
        { id: 'view-data', label: 'Ver Datos', icon: '📋', path: '/view-data' },
      ]
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: '⚙️',
      isSingle: true,
      path: '/settings'
    }
  ]
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  // Contenido del sidebar
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <span className="text-3xl">💰</span>
          {(!isCollapsed || isMobile) && (
            <div className="ml-3">
              <h1 className="text-xl font-bold text-slate-700">Gastos</h1>
              <p className="text-slate-600 text-xs">Gestor Personal</p>
            </div>
          )}
        </div>
        {!isMobile && !isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Colapsar"
          >
            <span className="text-lg">◀</span>
          </button>
        )}
        {!isMobile && isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors w-full"
            title="Expandir"
          >
            <span className="text-lg">▶</span>
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Cerrar"
          >
            <span className="text-lg">✕</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-3 w-full overflow-y-auto">
        {menuGroups.map((group) => {
          // Para items únicos sin submenú
          if (group.isSingle) {
            const isActive = location.pathname === group.path
            return (
              <button
                key={group.id}
                onClick={() => handleNavigate(group.path)}
                className={`w-full flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-start'} px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-slate-800 shadow-md border border-blue-300/50'
                    : 'text-slate-600 hover:bg-white/25 hover:text-slate-800'
                }`}
                title={(isCollapsed && !isMobile) ? group.label : ''}
              >
                <span className="text-2xl">{group.icon}</span>
                {(!isCollapsed || isMobile) && (
                  <span className="ml-3 font-semibold">{group.label}</span>
                )}
              </button>
            )
          }

          // Para grupos con submenú
          const isGroupExpanded = expandedGroups[group.id]
          const hasActiveItem = group.items.some(item => 
            location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard')
          )

          return (
            <div key={group.id} className="space-y-1">
              {/* Encabezado del grupo */}
              <button
                onClick={() => (!isCollapsed || isMobile) && toggleGroup(group.id)}
                className={`w-full flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all duration-200 ${
                  hasActiveItem
                    ? 'bg-white/25 text-slate-800 border border-white/40'
                    : 'text-slate-600 hover:bg-white/20 hover:text-slate-800'
                }`}
                title={(isCollapsed && !isMobile) ? group.label : ''}
              >
                <div className="flex items-center">
                  <span className="text-xl">{group.icon}</span>
                  {(!isCollapsed || isMobile) && (
                    <span className="ml-3 font-semibold text-sm uppercase tracking-wide">
                      {group.label}
                    </span>
                  )}
                </div>
                {(!isCollapsed || isMobile) && (
                  <span className={`text-xs transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                )}
              </button>

              {/* Items del grupo con diseño mejorado */}
              {(!isCollapsed || isMobile) && isGroupExpanded && (
                <div className="ml-4 space-y-1 animate-fade-in border-l-2 border-white/20 pl-3">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard')
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-400/40 to-purple-400/40 text-slate-800 font-semibold shadow-sm border-l-2 border-blue-500'
                            : 'text-slate-600 hover:bg-white/20 hover:text-slate-800 hover:border-l-2 hover:border-white/40'
                        }`}
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-white/20">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-start'} px-4 py-3 rounded-xl transition-all duration-200 text-red-600 hover:bg-red-50/50 hover:text-red-700 border border-red-200/50`}
          title={(isCollapsed && !isMobile) ? 'Cerrar Sesión' : ''}
        >
          <span className="text-xl">🚪</span>
          {(!isCollapsed || isMobile) && (
            <span className="ml-3 font-semibold">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </div>
  )

  // Si es móvil, mostrar topbar + drawer
  if (isMobile) {
    return (
      <>
        {/* Topbar móvil - estático, no fijo */}
        <div className="bg-white/95 backdrop-blur-lg border-b border-white/30 shadow-sm w-full">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Abrir menú"
              >
                <span className="text-2xl">☰</span>
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-700">💰 Gastos</h1>
                <p className="text-xs text-slate-600">Gestor Personal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar móvil (drawer) */}
        <aside
          className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-lg border-r border-white/30 p-6 transition-transform duration-300 ease-in-out flex flex-col z-40 w-72 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    )
  }

  // Sidebar desktop
  return (
    <aside 
      className={`bg-white/20 backdrop-blur-lg border-r border-white/30 p-6 transition-all duration-300 ease-in-out flex flex-col sticky top-0 h-screen ${
        isCollapsed ? 'w-20 sidebar-collapsed' : 'w-72 sidebar-expanded'
      }`}
    >
      {sidebarContent}
    </aside>
  )
}

export default Sidebar
