import React, { useState, useMemo } from 'react'

/**
 * Componente selector de rango de fechas con acceso rápido por año
 */
const DateRangeSelector = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange, 
  onCalculate,
  availableYears = []
}) => {
  const [showYearOptions, setShowYearOptions] = useState(false)
  const currentYear = new Date().getFullYear()

  // Generar lista de años si no se proporciona
  const years = useMemo(() => {
    if (availableYears.length > 0) return availableYears
    // Generar últimos 5 años por defecto
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [availableYears, currentYear])

  // Función para seleccionar año completo
  const selectYear = (year) => {
    onStartDateChange(`${year}-01-01`)
    onEndDateChange(`${year}-12-31`)
    setShowYearOptions(false)
  }

  // Función para seleccionar mes actual
  const selectCurrentMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
    onStartDateChange(`${year}-${month}-01`)
    onEndDateChange(`${year}-${month}-${lastDay}`)
  }

  // Función para seleccionar últimos 30 días
  const selectLast30Days = () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    onStartDateChange(start.toISOString().split('T')[0])
    onEndDateChange(end.toISOString().split('T')[0])
  }

  // Función para seleccionar todo el histórico
  const selectAllTime = () => {
    onStartDateChange('2020-01-01') // Fecha inicial razonable
    onEndDateChange(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      {/* Botones de acceso rápido */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2">
          📅 Acceso Rápido
        </label>
        <div className="flex flex-wrap gap-2">
          {/* Año actual */}
          <button
            onClick={() => selectYear(currentYear)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition-colors"
          >
            🗓️ {currentYear}
          </button>

          {/* Años anteriores dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowYearOptions(!showYearOptions)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition-colors flex items-center gap-1"
            >
              📚 Otros años
              <span className="text-[10px]">{showYearOptions ? '▲' : '▼'}</span>
            </button>
            
            {showYearOptions && (
              <div className="absolute top-full left-0 mt-1 bg-zinc-900 rounded-lg shadow-lg border border-zinc-700 py-1 z-50 min-w-[120px] max-h-48 overflow-y-auto">
                {years.filter(y => y !== currentYear).map(year => (
                  <button
                    key={year}
                    onClick={() => selectYear(year)}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-800/60 flex items-center gap-2"
                  >
                    <span>📅</span>
                    <span>{year}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mes actual */}
          <button
            onClick={selectCurrentMonth}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20 transition-colors"
          >
            📆 Este mes
          </button>

          <button
            onClick={selectLast30Days}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20 transition-colors"
          >
            ⏱️ 30 días
          </button>

          <button
            onClick={selectAllTime}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-600 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            📊 Todo
          </button>
        </div>
      </div>

      {/* Selectores de fecha manuales */}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-600 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <button
          onClick={onCalculate}
          className="gradient-button text-white px-5 py-2 rounded-lg font-medium hover:scale-105 transition-transform text-sm whitespace-nowrap"
        >
          🧮 Calcular
        </button>
      </div>

      {/* Indicador de rango seleccionado */}
      {startDate && endDate && (
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-700/60 rounded-lg p-2">
          <span>📅</span>
          <span>
            Rango seleccionado: <strong className="text-zinc-300">{startDate}</strong> al <strong className="text-zinc-300">{endDate}</strong>
          </span>
        </div>
      )}
    </div>
  )
}

export default DateRangeSelector
