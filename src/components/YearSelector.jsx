import React, { useState } from 'react'

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
  className = ''
}) => {
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

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-xs font-medium text-gray-500">📅 Año:</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
              yearFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          
          {currentYearHasData && (
            <button
              onClick={() => onFilterChange('current')}
              className={`px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                yearFilter === 'current'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currentYear}
            </button>
          )}
          
          {previousYears.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowPreviousYears(!showPreviousYears)}
                className={`px-2 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                  yearFilter === 'previous'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {yearFilter === 'previous' && selectedYear ? selectedYear : 'Anteriores'}
                <span className="text-[10px]">{showPreviousYears ? '▲' : '▼'}</span>
              </button>
              
              {showPreviousYears && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[80px]">
                  <button
                    onClick={() => {
                      onFilterChange('previous', null)
                      setShowPreviousYears(false)
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 font-medium"
                  >
                    Todos anteriores
                  </button>
                  {previousYears.map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        onFilterChange('previous', year)
                        setShowPreviousYears(false)
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100 ${
                        selectedYear === year ? 'bg-purple-50 text-purple-700' : ''
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
      </div>
    )
  }

  return (
    <div className={`glass-card rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
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
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
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
                ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
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
        <div className="relative">
          <button
            onClick={() => setShowPreviousYears(!showPreviousYears)}
            className={`w-full p-3 rounded-lg text-center transition-all ${
              yearFilter === 'previous'
                ? 'bg-purple-600 text-white shadow-md'
                : previousYears.length > 0
                  ? 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-48 overflow-y-auto">
              <button
                onClick={() => {
                  onFilterChange('previous', null)
                  setShowPreviousYears(false)
                }}
                className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 font-medium border-b border-gray-100"
              >
                📚 Todos los anteriores
              </button>
              {previousYears.map(year => (
                <button
                  key={year}
                  onClick={() => {
                    onFilterChange('previous', year)
                    setShowPreviousYears(false)
                  }}
                  className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex justify-between items-center ${
                    selectedYear === year ? 'bg-purple-50 text-purple-700' : ''
                  }`}
                >
                  <span>📅 {year}</span>
                  {showStats && statsByYear[year] && (
                    <span className="text-gray-400">
                      {statsByYear[year].count} reg.
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas del filtro actual */}
      {showStats && yearFilter !== 'all' && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">
              {yearFilter === 'current' ? `Datos de ${currentYear}:` : 
               selectedYear ? `Datos de ${selectedYear}:` : 'Años anteriores:'}
            </span>
            <span className="font-bold text-gray-700">
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
