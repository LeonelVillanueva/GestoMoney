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
  onToggleFilters 
}) => {
  if (!showFilters) {
    return (
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800">🔧 Filtros</h3>
        <button 
          onClick={onToggleFilters}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Mostrar Filtros
        </button>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">🔧 Filtros</h3>
        <button 
          onClick={onToggleFilters}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Ocultar Filtros
        </button>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="space-y-4">
          {/* Primera fila de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro por Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📅 Período</label>
              <select
                value={filters.period}
                onChange={(e) => onFilterChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos los períodos</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">📆 Año</label>
              <select
                value={filters.year}
                onChange={(e) => onFilterChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Categoría</label>
              <select
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
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
            <div className="flex items-end space-x-2">
              <button
                onClick={onClearFilters}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Segunda fila de filtros condicionales */}
          {(filters.period === 'specific_month' || filters.period === 'custom') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {/* Filtro por Mes Específico */}
              {filters.period === 'specific_month' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📆 Mes Específico</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha Inicio</label>
                    <CustomDatePicker
                      type="date"
                      value={filters.customStartDate}
                      onChange={(value) => onFilterChange('customStartDate', value)}
                      placeholder="Fecha de inicio"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📅 Fecha Fin</label>
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
