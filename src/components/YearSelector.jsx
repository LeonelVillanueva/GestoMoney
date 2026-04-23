import React, { useState, useRef, useEffect } from 'react'

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
  compact = false,
  className = '',
  /** Estilo alineado al panel oscuro (Dashboard actualizado). */
  variant = 'dark'
}) => {
  const isDark = variant === 'dark'
  const [showPreviousYears, setShowPreviousYears] = useState(false)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Verificar si el año actual tiene datos
  const currentYearHasData = availableYears.includes(currentYear)

  // Detectar si es móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  if (compact) {
    const inact = isDark
      ? 'bg-zinc-800/90 text-zinc-400 border border-zinc-700/80 hover:border-zinc-600 hover:text-zinc-200'
      : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700'
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`} style={{ position: 'relative', zIndex: showPreviousYears ? (isMobile ? 50 : 1000) : 'auto' }}>
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
            <div className="relative" style={{ zIndex: showPreviousYears ? (isMobile ? 51 : 1001) : 'auto' }}>
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
              
              {showPreviousYears && (
                <div
                  className={
                    isDark
                      ? 'absolute top-full left-0 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-2xl min-w-[80px]'
                      : 'absolute top-full left-0 mt-1 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 py-1 min-w-[80px]'
                  }
                  style={{ zIndex: isMobile ? 52 : 1002, position: 'absolute' }}
                >
                  {previousYears.map((year) => (
                    <button
                      type="button"
                      key={year}
                      onClick={() => {
                        onFilterChange('previous', year)
                        setShowPreviousYears(false)
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800 ${
                        selectedYear === year ? 'bg-violet-500/20 text-violet-300' : ''
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Overlay para cerrar al hacer click fuera cuando el dropdown está abierto */}
        {showPreviousYears && (
          <div
            className="fixed inset-0"
            onClick={() => setShowPreviousYears(false)}
            style={{ 
              position: 'fixed',
              zIndex: isMobile ? 49 : 999,
              backgroundColor: 'transparent'
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`glass-card rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
          <span>📅</span>
          <span>Filtrar por Año</span>
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

      <div className="grid grid-cols-3 gap-2">
        {/* Todos */}
        <button
          onClick={() => onFilterChange('all')}
          className={`p-3 rounded-lg text-center transition-all ${
            yearFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-zinc-800/50 hover:bg-zinc-800/60 text-zinc-300'
          }`}
        >
          <div className="text-lg mb-1">📊</div>
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
          <div className="text-lg mb-1">🗓️</div>
          <div className="text-xs font-bold">{currentYear}</div>
          <div className="text-[10px] opacity-80">Año actual</div>
          {showStats && statsByYear[currentYear] && (
            <div className="text-[10px] mt-1 font-medium">
              {statsByYear[currentYear].count} registros
            </div>
          )}
        </button>

        {/* Años Anteriores */}
        <div className="relative" style={{ zIndex: showPreviousYears ? 1001 : 'auto' }}>
          <button
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
            <div className="text-lg mb-1">📚</div>
            <div className="text-xs font-bold">
              {yearFilter === 'previous' && selectedYear ? selectedYear : 'Anteriores'}
            </div>
            <div className="text-[10px] opacity-80 flex items-center justify-center gap-1">
              {previousYears.length > 0 ? `${previousYears.length} años` : 'Sin datos'}
              {previousYears.length > 0 && <span>{showPreviousYears ? '▲' : '▼'}</span>}
            </div>
          </button>

          {/* Dropdown de años anteriores */}
          {showPreviousYears && previousYears.length > 0 && (
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 rounded-lg shadow-2xl border border-zinc-700 py-1 max-h-48 overflow-y-auto"
              style={{ 
                zIndex: 1002,
                position: 'absolute'
              }}
            >
              {previousYears.map(year => (
                <button
                  key={year}
                  onClick={() => {
                    onFilterChange('previous', year)
                    setShowPreviousYears(false)
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-zinc-800/80 ${
                    selectedYear === year ? 'bg-violet-500/20 text-violet-200' : 'text-zinc-200'
                  }`}
                >
                  <span>📅 {year}</span>
                  {showStats && statsByYear[year] && (
                    <span className="text-zinc-500">
                      {statsByYear[year].count} reg.
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Overlay para cerrar al hacer click fuera cuando el dropdown está abierto */}
        {showPreviousYears && (
          <div
            className="fixed inset-0"
            onClick={() => setShowPreviousYears(false)}
            style={{ 
              position: 'fixed',
              zIndex: 999,
              backgroundColor: 'transparent'
            }}
          />
        )}
      </div>

      {/* Estadísticas del filtro actual */}
      {showStats && yearFilter !== 'all' && (
        <div className="mt-3 p-2 bg-zinc-800/50 rounded-lg">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">
              {yearFilter === 'current' ? `Datos de ${currentYear}:` : 
               selectedYear ? `Datos de ${selectedYear}:` : 'Años anteriores:'}
            </span>
            <span className="font-bold text-zinc-300">
              {yearFilter === 'current' 
                ? formatCurrency(statsByYear[currentYear]?.total || 0)
                : selectedYear 
                  ? formatCurrency(statsByYear[selectedYear]?.total || 0)
                  : formatCurrency(
                      previousYears.reduce((sum, y) => sum + (statsByYear[y]?.total || 0), 0)
                    )
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default YearSelector
