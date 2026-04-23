import React, { useRef, useEffect } from 'react'

/**
 * Componente de barra de búsqueda y filtros para ViewData
 */
const SearchBar = ({
  searchFilters,
  activeTab,
  availableCategories,
  showFilters,
  hasActiveFilters,
  filteredDataLength,
  onSearchChange,
  onFilterChange,
  onToggleFilters,
  onClearFilters
}) => {
  const searchInputRef = useRef(null)

  // Mantener el foco en el input de búsqueda
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      // Solo restaurar el foco si el usuario estaba escribiendo
      const isUserTyping = searchFilters.searchText.length > 0
      if (isUserTyping) {
        searchInputRef.current.focus()
        // Restaurar la posición del cursor al final
        const length = searchInputRef.current.value.length
        searchInputRef.current.setSelectionRange(length, length)
      }
    }
  }, [searchFilters.searchText])

  return (
    <div className="glass-card rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🔍</span>
          <h3 className="text-lg font-bold text-zinc-100">Búsqueda y Filtros</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs rounded-full font-medium border border-sky-500/35 bg-sky-500/10 text-sky-200">
              {filteredDataLength} resultados
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggleFilters}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800/50 text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <span>{showFilters ? '🔼' : '🔽'}</span>
            <span className="text-sm font-medium">Filtros</span>
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-red-500/35 bg-red-500/10 text-red-200 hover:bg-red-500/20 transition-colors"
            >
              <span>❌</span>
              <span className="text-sm font-medium">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de búsqueda principal */}
      <div className="relative mb-4">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar por descripción, categoría, supermercado o tipo de corte..."
          value={searchFilters.searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-3 pl-12 border border-zinc-600 rounded-xl bg-zinc-900/40 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/40 transition-all"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <span className="text-gray-400">🔍</span>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-zinc-800/50 rounded-xl">
          {/* Rango de fechas */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              📅 Fecha desde
            </label>
            <input
              type="date"
              value={searchFilters.dateFrom}
              onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              📅 Fecha hasta
            </label>
            <input
              type="date"
              value={searchFilters.dateTo}
              onChange={(e) => onFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categoría (solo para gastos) */}
          {activeTab === 'gastos' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                🏷️ Categoría
              </label>
              <select
                value={searchFilters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tipo de transacción (solo para gastos) */}
          {activeTab === 'gastos' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                💰 Tipo
              </label>
              <select
                value={searchFilters.transactionType}
                onChange={(e) => onFilterChange('transactionType', e.target.value)}
                className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="gastos">Solo Gastos</option>
                <option value="ingresos">Solo Ingresos</option>
              </select>
            </div>
          )}

          {/* Rango de montos (solo para gastos y supermercado) */}
          {(activeTab === 'gastos' || activeTab === 'supermercado') && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  💰 Monto mínimo
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={searchFilters.minAmount}
                  onChange={(e) => onFilterChange('minAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  💰 Monto máximo
                </label>
                <input
                  type="number"
                  placeholder="Sin límite"
                  value={searchFilters.maxAmount}
                  onChange={(e) => onFilterChange('maxAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
