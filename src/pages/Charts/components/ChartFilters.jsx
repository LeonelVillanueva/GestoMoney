import React from 'react'
import CustomDatePicker from '../../../components/CustomDatePicker'

/**
 * Componente de filtros para gráficos
 */
const ChartFilters = ({ 
  filters, 
  showFilters, 
  onFilterChange, 
  onClearFilters, 
  onToggleFilters,
  yearOptions = [],
  currentYear = new Date().getFullYear()
}) => {
  const selectableYears = Array.from(new Set([currentYear, ...yearOptions]))
    .sort((a, b) => b - a)

  if (!showFilters) {
    return (
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-100">🔧 Filtros</h3>
        <button
          type="button"
          onClick={onToggleFilters}
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          Mostrar filtros
        </button>
      </div>
    )
  }

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-100">🔧 Filtros</h3>
        <button
          type="button"
          onClick={onToggleFilters}
          className="text-xs font-medium text-sky-400 hover:text-sky-300"
        >
          Ocultar filtros
        </button>
      </div>
      
      <div className="p-3 bg-zinc-800/50 rounded-lg">
        <div className="space-y-3">
          {/* Primera fila de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Filtro por Período */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">📅 Período</label>
              <select
                value={filters.period}
                onChange={(e) => onFilterChange('period', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-zinc-600 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40"
              >
                <option value="all">Todos</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="specific_month">Mes específico</option>
                <option value="custom">Rango personalizado</option>
                <option value="quarter">Trimestres</option>
                <option value="year">Año completo</option>
              </select>
            </div>
            
            {/* Filtro por Año */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">📆 Año</label>
              <select
                value={filters.year}
                onChange={(e) => onFilterChange('year', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-zinc-600 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40"
              >
                {selectableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por Categoría */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">🏷️ Categoría</label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-zinc-600 rounded-lg bg-zinc-900/50 text-zinc-100 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40"
              >
                <option value="all">Todas</option>
                <option value="Comida">Comida</option>
                <option value="Transporte">Transporte</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Regalos">Regalos</option>
                <option value="Utilidades">Utilidades</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            
            {/* Botones de Acción */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={onClearFilters}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-zinc-600 bg-zinc-800/60 text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Segunda fila de filtros condicionales */}
          {(filters.period === 'specific_month' || filters.period === 'custom') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-zinc-700">
              {/* Filtro por Mes Específico */}
              {filters.period === 'specific_month' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">📆 Mes Específico</label>
                  <CustomDatePicker
                    type="month"
                    value={filters.month}
                    onChange={(value) => onFilterChange('month', value)}
                    placeholder="Seleccionar mes"
                    className="w-full"
                  />
                </div>
              )}

              {/* Filtros de Rango Personalizado */}
              {filters.period === 'custom' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">📅 Fecha Inicio</label>
                    <CustomDatePicker
                      type="date"
                      value={filters.customStartDate}
                      onChange={(value) => onFilterChange('customStartDate', value)}
                      placeholder="Fecha de inicio"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">📅 Fecha Fin</label>
                    <CustomDatePicker
                      type="date"
                      value={filters.customEndDate}
                      onChange={(value) => onFilterChange('customEndDate', value)}
                      placeholder="Fecha de fin"
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartFilters
