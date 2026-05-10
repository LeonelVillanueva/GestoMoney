import React, { useState, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Componente selector de año reutilizable
 * Permite filtrar por: Año actual, Años anteriores (con dropdown), Todos
 */
const YearSelector = ({
  yearFilter,
  selectedYear,
  currentYear,
  previousYears = [],
  availableYears = [],
  onFilterChange,
  showStats = false,
  statsByYear = {},
  /** Resumen bajo el selector (showStats): 'total' suma todos los montos; 'gastos' solo egresos (útil si hay ingresos en el mismo dataset). */
  summaryMetric = 'total',
  compact = false,
  className = '',
  /** Estilo alineado al panel oscuro (Dashboard actualizado). */
  variant = 'dark'
}) => {
  const isDark = variant === 'dark'
  const [showPreviousYears, setShowPreviousYears] = useState(false)
  const previousYearsAnchorRef = useRef(null)
  /** Posición viewport para menú en portal (evita quedar bajo capas por transform en ancestros, típico en móvil). */
  const [previousYearsMenuBox, setPreviousYearsMenuBox] = useState(null)

  useLayoutEffect(() => {
    if (!showPreviousYears || previousYears.length === 0) {
      setPreviousYearsMenuBox(null)
      return undefined
    }

    const anchor = previousYearsAnchorRef.current
    if (!anchor) return undefined

    const VIEW_PAD = 8
    const GAP = 4
    /** Igual que antes: ~min(40vh, 12rem), pero acotado al hueco real en pantalla */
    const preferredMaxH = () => {
      const vh = window.innerHeight
      return Math.min(vh * 0.4, 192)
    }

    const updateBox = () => {
      const r = anchor.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const minW = compact ? 120 : 160

      let panelWidth = Math.max(r.width, minW)
      panelWidth = Math.min(panelWidth, vw - 2 * VIEW_PAD)

      let left = r.left
      left = Math.max(VIEW_PAD, Math.min(left, vw - VIEW_PAD - panelWidth))

      const maxHPreferred = preferredMaxH()

      let topBelow = r.bottom + GAP
      const spaceBelow = Math.max(0, vh - VIEW_PAD - topBelow)
      const spaceAbove = Math.max(0, r.top - VIEW_PAD - GAP)

      let top
      let maxHeight

      const preferAbove =
        spaceBelow < Math.min(maxHPreferred, 140) && spaceAbove > spaceBelow

      if (preferAbove) {
        maxHeight = Math.min(maxHPreferred, spaceAbove)
        top = r.top - GAP - maxHeight
      } else {
        maxHeight = Math.min(maxHPreferred, spaceBelow)
        top = topBelow
      }

      top = Math.max(VIEW_PAD, top)
      maxHeight = Math.min(maxHeight, vh - VIEW_PAD - top)
      top = Math.min(top, vh - VIEW_PAD - maxHeight)
      top = Math.max(VIEW_PAD, top)
      maxHeight = Math.min(maxHeight, vh - VIEW_PAD - top)

      setPreviousYearsMenuBox({
        top,
        left,
        width: panelWidth,
        maxHeight
      })
    }

    updateBox()
    const main = typeof document !== 'undefined' ? document.querySelector('[data-app-shell="main"]') : null
    window.addEventListener('resize', updateBox)
    main?.addEventListener('scroll', updateBox, { passive: true })
    window.addEventListener('scroll', updateBox, { passive: true, capture: true })

    return () => {
      window.removeEventListener('resize', updateBox)
      main?.removeEventListener('scroll', updateBox)
      window.removeEventListener('scroll', updateBox, true)
    }
  }, [showPreviousYears, previousYears.length, compact])

  const closePreviousYears = () => {
    setShowPreviousYears(false)
    setPreviousYearsMenuBox(null)
  }

  const renderPreviousYearsPortal = (variantCompact) => {
    if (
      typeof document === 'undefined' ||
      !document.body ||
      !showPreviousYears ||
      previousYears.length === 0 ||
      previousYearsMenuBox == null
    ) {
      return null
    }

    return createPortal(
      <>
        <div
          className="fixed inset-0 z-[8000]"
          aria-hidden
          style={{ backgroundColor: 'transparent' }}
          onClick={closePreviousYears}
        />
        <div
          role="listbox"
          aria-label="Años anteriores"
          className="fixed z-[8050] overflow-y-auto overflow-x-hidden rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
          style={{
            top: previousYearsMenuBox.top,
            left: previousYearsMenuBox.left,
            width: previousYearsMenuBox.width,
            maxHeight: previousYearsMenuBox.maxHeight
          }}
        >
          {variantCompact
            ? previousYears.map((year) => (
                <button
                  type="button"
                  key={year}
                  role="option"
                  onClick={() => {
                    onFilterChange('previous', year)
                    closePreviousYears()
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800 ${
                    selectedYear === year ? 'bg-violet-500/20 text-violet-300' : ''
                  }`}
                >
                  {year}
                </button>
              ))
            : previousYears.map((year) => (
                <button
                  type="button"
                  key={year}
                  role="option"
                  onClick={() => {
                    onFilterChange('previous', year)
                    closePreviousYears()
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-zinc-800/80 ${
                    selectedYear === year ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-200'
                  }`}
                >
                  <span>{year}</span>
                  {showStats && statsByYear[year] && (
                    <span className="text-zinc-500">{statsByYear[year].count} reg.</span>
                  )}
                </button>
              ))}
        </div>
      </>,
      document.body
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const statAmount = (yearStats) => {
    if (!yearStats) return 0
    return summaryMetric === 'gastos' ? yearStats.gastos || 0 : yearStats.total || 0
  }

  // Verificar si el año actual tiene datos
  const currentYearHasData = availableYears.includes(currentYear)

  if (compact) {
    const inact = isDark
      ? 'bg-zinc-800/90 text-zinc-400 border border-zinc-700/80 hover:border-zinc-600 hover:text-zinc-200'
      : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700'
    return (
      <>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
          <svg
            className="h-3.5 w-3.5 opacity-80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V9.75m0 0h.008v.008H3V9.75z"
            />
          </svg>
          Año
        </span>
        <div className="flex flex-wrap gap-1" style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
              yearFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : inact
            }`}
          >
            Todos
          </button>
          
          {currentYearHasData && (
            <button
              type="button"
              onClick={() => onFilterChange('current')}
              className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                yearFilter === 'current'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : inact
              }`}
            >
              {currentYear}
            </button>
          )}
          
          {previousYears.length > 0 && (
            <div ref={previousYearsAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => setShowPreviousYears(!showPreviousYears)}
                className={`px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                  yearFilter === 'previous' ? 'bg-violet-600 text-white shadow-sm' : inact
                }`}
              >
                {yearFilter === 'previous' && selectedYear ? selectedYear : 'Anteriores'}
                <span className="text-[10px]">{showPreviousYears ? '▲' : '▼'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {renderPreviousYearsPortal(true)}
      </>
    )
  }

  return (
    <>
    <div
      className={`glass-card relative rounded-xl p-4 ${showPreviousYears ? 'z-[120]' : 'z-auto'} ${className}`}
    >
      <div className="relative z-[125] flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-300">
          Filtrar por año
        </h3>
        {yearFilter !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver todos
          </button>
        )}
      </div>

      <div className="relative z-[125] grid grid-cols-3 gap-2">
        {/* Todos */}
        <button
          onClick={() => onFilterChange('all')}
          className={`p-3 rounded-lg text-center transition-all ${
            yearFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-zinc-800/50 hover:bg-zinc-800/60 text-zinc-300'
          }`}
        >
          <div className="text-xs font-bold">Todos</div>
          <div className="text-[10px] opacity-80">Histórico completo</div>
          {showStats && (
            <div className="text-[10px] mt-1 font-medium">
              {Object.values(statsByYear).reduce((sum, s) => sum + s.count, 0)} registros
            </div>
          )}
        </button>

        {/* Año Actual */}
        <button
          onClick={() => onFilterChange('current')}
          className={`p-3 rounded-lg text-center transition-all ${
            yearFilter === 'current'
              ? 'bg-green-600 text-white shadow-md'
              : currentYearHasData 
                ? 'bg-zinc-800/50 hover:bg-zinc-800/60 text-zinc-300'
                : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
          }`}
          disabled={!currentYearHasData}
        >
          <div className="text-xs font-bold">{currentYear}</div>
          <div className="text-[10px] opacity-80">Año actual</div>
          {showStats && statsByYear[currentYear] && (
            <div className="text-[10px] mt-1 font-medium">
              {statsByYear[currentYear].count} registros
            </div>
          )}
        </button>

        {/* Años Anteriores */}
        <div ref={previousYearsAnchorRef} className="relative" style={{ zIndex: showPreviousYears ? 20 : 'auto' }}>
          <button
            type="button"
            onClick={() => setShowPreviousYears(!showPreviousYears)}
            className={`w-full p-3 rounded-lg text-center transition-all ${
              yearFilter === 'previous'
                ? 'bg-purple-600 text-white shadow-md'
                : previousYears.length > 0
                  ? 'bg-zinc-800/50 hover:bg-zinc-800/60 text-zinc-300'
                  : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
            }`}
            disabled={previousYears.length === 0}
          >
            <div className="text-xs font-bold">
              {yearFilter === 'previous' && selectedYear ? selectedYear : 'Anteriores'}
            </div>
            <div className="text-[10px] opacity-80 flex items-center justify-center gap-1">
              {previousYears.length > 0 ? `${previousYears.length} años` : 'Sin datos'}
              {previousYears.length > 0 && <span>{showPreviousYears ? '▲' : '▼'}</span>}
            </div>
          </button>

        </div>
      </div>

      {/* Estadísticas del filtro actual */}
      {showStats && yearFilter !== 'all' && (
        <div className="relative z-[125] mt-3 rounded-lg bg-zinc-800/50 p-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">
              {summaryMetric === 'gastos'
                ? yearFilter === 'current'
                  ? `Total gastos ${currentYear}:`
                  : selectedYear
                    ? `Total gastos ${selectedYear}:`
                    : 'Total gastos (años ant.):'
                : yearFilter === 'current'
                  ? `Datos de ${currentYear}:`
                  : selectedYear
                    ? `Datos de ${selectedYear}:`
                    : 'Años anteriores:'}
            </span>
            <span className="font-bold text-zinc-300">
              {yearFilter === 'current'
                ? formatCurrency(statAmount(statsByYear[currentYear]))
                : selectedYear
                  ? formatCurrency(statAmount(statsByYear[selectedYear]))
                  : formatCurrency(
                      previousYears.reduce((sum, y) => sum + statAmount(statsByYear[y]), 0)
                    )}
            </span>
          </div>
        </div>
      )}
    </div>
    {renderPreviousYearsPortal(false)}
    </>
  )
}

export default YearSelector
