import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import notifications from '../utils/services/notifications'
import logger from '../utils/logger'

const icon = (d, className = 'h-5 w-5') => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    {typeof d === 'string' ? <path strokeLinecap="round" strokeLinejoin="round" d={d} /> : d}
  </svg>
)

const Icons = {
  home: () =>
    icon('M2.25 12l8.955-8.955a.75.75 0 011.06 0L21.75 12M4.5 9.75v10.125a.75.75 0 00.75.75H9v-4.875A.375.375 0 019.375 15h5.25a.375.375 0 01.375.375V21h4.125a.75.75 0 00.75-.75V9.75M8.25 21h7.5'),
  chart: () =>
    icon('M3 13.125C3 12.504 3.504 12 4.125 12h1.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-1.5A1.125 1.125 0 013 18.75v-5.625zM9.75 8.625c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 3.75c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125V4.875c0-.621.504-1.125 1.125-1.125h1.5z'),
  plus: () => icon('M12 4.5v15m7.5-7.5h-15'),
  calc: () =>
    icon(
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 15.75V18a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V6a.75.75 0 01.75-.75H9M9 3h3.75M9 3v3.75M12 3v3.75M12 3h2.25M15 6.75H9M9 6.75h6M9 9.75h6M9 12.75h3"
      />
    ),
  coin: () =>
    icon('M12 6v12M9.75 9.75A3 3 0 0112 6a3 3 0 012.25.75M9.75 14.25A3 3 0 0012 18a3 3 0 002.25-.75'),
  line: () =>
    icon('M2.25 18L9 11.25l3.75 3.75L21.75 4.5M2.25 4.5h3.75V8.25'),
  cart: () =>
    icon('M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a1.5 1.5 0 00-1.5 1.5v1.5a.75.75 0 00.75.75H18a.75.75 0 00.75-.75v-1.5a1.5 1.5 0 00-1.5-1.5H7.5zM5.25 4.5h15l-1.5 6.75H6.75L5.25 4.5z'),
  scissor: () =>
    icon(
      'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z'
    ),
  list: () =>
    icon('M8.25 6.75h12M8.25 12h12M8.25 17.25h12M2.25 6.75h.01M2.25 12h.01M2.25 17.25h.01'),
  gear: () =>
    icon('M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.292.24-.437.613-.43.992a6.723 6.723 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28zM15 12a3 3 0 11-6 0 3 3 0 016 0z'),
  logout: () => icon('M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75'),
  wallet: () =>
    icon(
      'M21 12.004v4.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.504v-9a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.254V12M16.5 12h.008v.008H16.5V12zM3 9.754h10.5a1.5 1.5 0 010 3H3v-3z'
    ),
  chev: (open) => (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

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
      icon: Icons.home,
      items: [
        { id: 'dashboard', label: 'Panel', icon: Icons.chart, path: '/dashboard' },
        { id: 'add-expense', label: 'Agregar gasto', icon: Icons.plus, path: '/add-expense' }
      ]
    },
    {
      id: 'analysis',
      label: 'Análisis',
      icon: Icons.line,
      items: [
        { id: 'calculate-expense', label: 'Calcula tu gasto', icon: Icons.calc, path: '/calculate-expense' },
        { id: 'budgets', label: 'Presupuestos', icon: Icons.coin, path: '/budgets' },
        { id: 'charts', label: 'Gráficos', icon: Icons.line, path: '/charts' }
      ]
    },
    {
      id: 'tracking',
      label: 'Seguimiento',
      icon: Icons.list,
      items: [
        { id: 'supermarket', label: 'Supermercado', icon: Icons.cart, path: '/supermarket' },
        { id: 'cuts', label: 'Cortes', icon: Icons.scissor, path: '/cuts' },
        { id: 'view-data', label: 'Ver datos', icon: Icons.list, path: '/view-data' }
      ]
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: Icons.gear,
      isSingle: true,
      path: '/settings'
    }
  ]

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const navItemBase =
    'w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200'
  const navItemActive = 'bg-blue-500/20 text-white ring-1 ring-blue-500/30'
  const navItemIdle = 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/50 text-blue-400">
            {Icons.wallet()}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-100">Gestor de gastos</h1>
              <p className="text-xs text-zinc-500">Finanzas personales</p>
            </div>
          )}
        </div>
        {!isMobile && !isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            title="Contraer"
            aria-label="Contraer menú"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        {!isMobile && isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="w-full rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800"
            title="Expandir"
            aria-label="Expandir menú"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"
            title="Cerrar"
            aria-label="Cerrar menú"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {menuGroups.map((group) => {
          if (group.isSingle) {
            const isActive = location.pathname === group.path
            const Ic = group.icon
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleNavigate(group.path)}
                className={`${navItemBase} ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-start gap-3'} ${
                  isActive ? navItemActive : navItemIdle
                }`}
                title={isCollapsed && !isMobile ? group.label : ''}
              >
                <span className="shrink-0 text-blue-400/90">
                  <Ic />
                </span>
                {(!isCollapsed || isMobile) && <span>{group.label}</span>}
              </button>
            )
          }

          const isGroupExpanded = expandedGroups[group.id]
          const hasActiveItem = group.items.some(
            (item) => location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard')
          )
          const GroupIcon = group.icon

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => (!isCollapsed || isMobile) && toggleGroup(group.id)}
                className={`w-full flex items-center rounded-xl px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
                  (isCollapsed && !isMobile) ? 'justify-center' : 'justify-between'
                } ${hasActiveItem ? 'text-zinc-200' : 'text-zinc-500'} hover:text-zinc-200`}
                title={isCollapsed && !isMobile ? group.label : ''}
              >
                <span className="flex items-center gap-2">
                  <span className="shrink-0 text-zinc-500">
                    <GroupIcon />
                  </span>
                  {(!isCollapsed || isMobile) && <span>{group.label}</span>}
                </span>
                {(!isCollapsed || isMobile) && Icons.chev(isGroupExpanded)}
              </button>
              {(!isCollapsed || isMobile) && isGroupExpanded && (
                <div className="ml-1 space-y-0.5 border-l border-zinc-800 pl-2">
                  {group.items.map((item) => {
                    const Ic = item.icon
                    const isActive =
                      location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard')
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className={`relative w-full flex items-center gap-2.5 rounded-lg py-2 pl-2 pr-1 text-sm transition-colors ${
                          isActive
                            ? 'pl-2 font-semibold text-white before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded before:bg-blue-500'
                            : 'text-zinc-500 hover:text-zinc-200'
                        }`}
                      >
                        <span className="shrink-0 opacity-80">
                          <Ic />
                        </span>
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-800/80 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:border-rose-500/40 hover:bg-rose-500/10 ${
            (isCollapsed && !isMobile) ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed && !isMobile ? 'Cerrar sesión' : ''}
        >
          {Icons.logout()}
          {(!isCollapsed || isMobile) && 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )

  const shell = 'border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md'

  if (isMobile) {
    return (
      <>
        <div className={`w-full border-b ${shell}`}>
          <div className="flex items-center justify-between p-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"
              aria-label="Abrir menú"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
            <div className="min-w-0 text-right">
              <h1 className="truncate text-base font-semibold text-zinc-100">Gestor de gastos</h1>
              <p className="text-xs text-zinc-500">Menú</p>
            </div>
            <div className="w-9" />
          </div>
        </div>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[1001] bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsMobileMenuOpen(false)}
            role="presentation"
          />
        )}
        <aside
          className={`fixed left-0 top-0 z-[1002] flex h-full w-72 max-w-[85vw] flex-col border-r p-4 transition-transform duration-300 ${shell} ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>
      </>
    )
  }

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r p-4 transition-all duration-300 ${shell} ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {sidebarContent}
    </aside>
  )
}

export default Sidebar
