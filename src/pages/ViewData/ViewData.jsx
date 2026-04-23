import React, { useState, useCallback, useMemo } from 'react'
import { useViewData } from './hooks/useViewData'
import { useDataPagination } from './hooks/useDataPagination'
import { useViewDataFilters } from './hooks/useViewDataFilters'
import { useYearFilter } from '../../hooks/useYearFilter'
import YearSelector from '../../components/YearSelector'
import SearchBar from './components/SearchBar'
import Pagination from './components/Pagination'
import EditForm from './components/EditForm'
import DeleteConfirmModal from '../../components/DeleteConfirmModal'
import { formatCurrency, formatDate, convertToCSV } from './utils/viewDataFormatters'
import { getCategoryIcon, getSupermarketIcon, getCutIcon, downloadCSVFile } from './utils/viewDataHelpers'
import notifications from '../../utils/services/notifications'
import DateInput from '../../components/DateInput'

const ViewData = ({ onDataChanged }) => {
  const [activeTab, setActiveTab] = useState('gastos')
  const itemsPerPage = 25
  
  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemType: null,
    itemName: ''
  })

  // Estado para el modal de confirmación de edición
  const [editModal, setEditModal] = useState({
    isOpen: false,
    item: null,
    itemType: null,
    itemName: ''
  })

  // Hooks personalizados
  const {
    expenses,
    supermarketPurchases,
    cuts,
    loading,
    refreshing,
    editingItem,
    editForm,
    setEditForm,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteItem,
    loadAllData
  } = useViewData(onDataChanged)

  // Hook para filtro de año - combinar todos los datos para obtener años disponibles
  const allData = useMemo(() => [...expenses, ...supermarketPurchases, ...cuts], [expenses, supermarketPurchases, cuts])
  
  const {
    yearFilter,
    selectedYear,
    currentYear,
    availableYears,
    previousYears,
    filterLabel,
    statsByYear,
    handleYearFilterChange
  } = useYearFilter(allData)

  // Filtrar datos por año antes de aplicar otros filtros
  const filterByYear = useCallback((data) => {
    if (!data || data.length === 0) return []
    
    return data.filter(item => {
      if (!item.fecha) return yearFilter === 'all'
      
      const itemYear = new Date(item.fecha).getFullYear()
      
      switch (yearFilter) {
        case 'current':
          return itemYear === currentYear
        case 'previous':
          if (selectedYear) {
            return itemYear === selectedYear
          }
          return itemYear < currentYear
        case 'all':
        default:
          return true
      }
    })
  }, [yearFilter, selectedYear, currentYear])

  // Datos filtrados por año
  const expensesByYear = useMemo(() => filterByYear(expenses), [expenses, filterByYear])
  const supermarketByYear = useMemo(() => filterByYear(supermarketPurchases), [supermarketPurchases, filterByYear])
  const cutsByYear = useMemo(() => filterByYear(cuts), [cuts, filterByYear])

  const {
    searchFilters,
    showFilters,
    setShowFilters,
    availableCategories,
    hasActiveFilters,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    applyFilters
  } = useViewDataFilters(activeTab)

  // Obtener datos del tab actual (ya filtrados por año)
  const getCurrentTabData = useCallback(() => {
    switch (activeTab) {
      case 'gastos':
        return expensesByYear
      case 'supermercado':
        return supermarketByYear
      case 'cortes':
        return cutsByYear
      default:
        return []
    }
  }, [activeTab, expensesByYear, supermarketByYear, cutsByYear])

  // Datos filtrados (por año + otros filtros)
  const filteredData = useMemo(() => {
    return applyFilters(getCurrentTabData(), activeTab)
  }, [applyFilters, getCurrentTabData, activeTab])

  // Paginación
  const {
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    setCurrentPage
  } = useDataPagination(filteredData, itemsPerPage)

  // Resetear página cuando cambie de tab, filtros o año
  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filteredData.length, setCurrentPage, yearFilter, selectedYear])

  // Manejar cambios en el formulario de edición
  const handleFormChange = useCallback((updates) => {
    setEditForm(prev => ({ ...prev, ...updates }))
  }, [setEditForm])

  // Descargar CSV (datos filtrados por año)
  const downloadCSV = useCallback(() => {
    const currentData = getCurrentTabData()
    const csvContent = convertToCSV(currentData, activeTab)
    
    if (!csvContent) {
      notifications.showSync('❌ No hay datos para descargar', 'error')
      return
    }

    const yearSuffix = yearFilter === 'all' ? 'todos' : yearFilter === 'current' ? currentYear : selectedYear || 'anteriores'
    const filename = `${activeTab}_${yearSuffix}_${new Date().toISOString().split('T')[0]}.csv`
    if (downloadCSVFile(csvContent, filename)) {
      notifications.showSync('✅ Archivo CSV descargado correctamente', 'success')
    }
  }, [activeTab, getCurrentTabData, yearFilter, currentYear, selectedYear])

  const cutTypes = [
    'Corte básico', 'Corte y peinado', 'Corte + barba', 
    'Corte + tinte', 'Corte + mechas', 'Tratamiento capilar', 'Otros'
  ]

  // Función para abrir el modal de confirmación de eliminación
  const openDeleteModal = useCallback((item, type) => {
    let itemName = ''
    switch (type) {
      case 'gastos':
        itemName = `${item.descripcion || 'Gasto'} - ${formatCurrency(item.monto)}`
        break
      case 'supermercado':
        itemName = `${item.supermercado} - ${formatCurrency(item.monto)}`
        break
      case 'cortes':
        itemName = `${item.tipo_corte} - ${formatDate(item.fecha)}`
        break
      default:
        itemName = 'Este registro'
    }

    setDeleteModal({
      isOpen: true,
      itemId: item.id,
      itemType: type,
      itemName
    })
  }, [])

  // Función para confirmar la eliminación (llamada después de verificar el PIN)
  const confirmDelete = useCallback(async () => {
    if (deleteModal.itemId && deleteModal.itemType) {
      await deleteItem(deleteModal.itemId, deleteModal.itemType, true) // true = skip confirm
    }
    setDeleteModal({ isOpen: false, itemId: null, itemType: null, itemName: '' })
  }, [deleteModal, deleteItem])

  // Cerrar modal sin eliminar
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, itemId: null, itemType: null, itemName: '' })
  }, [])

  // Función para abrir el modal de confirmación de edición
  const openEditModal = useCallback((item, type) => {
    let itemName = ''
    switch (type) {
      case 'gastos':
        itemName = `${item.descripcion || 'Gasto'} - ${formatCurrency(item.monto)}`
        break
      case 'supermercado':
        itemName = `${item.supermercado} - ${formatCurrency(item.monto)}`
        break
      case 'cortes':
        itemName = `${item.tipo_corte} - ${formatDate(item.fecha)}`
        break
      default:
        itemName = 'Este registro'
    }

    setEditModal({
      isOpen: true,
      item,
      itemType: type,
      itemName
    })
  }, [])

  // Función para confirmar la edición (llamada después de verificar el PIN)
  const confirmEdit = useCallback(() => {
    if (editModal.item && editModal.itemType) {
      startEdit(editModal.item, editModal.itemType)
    }
    setEditModal({ isOpen: false, item: null, itemType: null, itemName: '' })
  }, [editModal, startEdit])

  // Cerrar modal sin editar
  const closeEditModal = useCallback(() => {
    setEditModal({ isOpen: false, item: null, itemType: null, itemName: '' })
  }, [])

  // Tabs con conteo filtrado por año
  const tabs = [
    { id: 'gastos', label: 'Gastos', icon: '💰', count: expensesByYear.length },
    { id: 'supermercado', label: 'Supermercado', icon: '🛒', count: supermarketByYear.length },
    { id: 'cortes', label: 'Cortes', icon: '💇', count: cutsByYear.length }
  ]

  // Renderizar gastos
  const renderGastos = () => {
    return (
      <div className="space-y-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          filteredDataLength={filteredData.length}
          totalDataLength={expensesByYear.length}
          hasActiveFilters={hasActiveFilters}
          onPageChange={handlePageChange}
        />
        
        {filteredData.length > 0 ? (
          <div className="space-y-2">
            {paginatedData.map((expense) => (
              <div key={expense.id} className="glass-card rounded-lg p-3 hover:shadow-md transition-all">
                {editingItem && editingItem.id === expense.id && editingItem.type === 'gastos' ? (
                  <EditForm
                    editingItem={editingItem}
                    editForm={editForm}
                    availableCategories={availableCategories}
                    onFormChange={handleFormChange}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${expense.es_entrada ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-zinc-800/50'}`}>
                        <span className="text-lg">{getCategoryIcon(expense)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-100 truncate">{expense.descripcion}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-zinc-400">{expense.categoria_nombre}</p>
                          {expense.es_entrada && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/35 text-emerald-300 text-xs rounded font-medium">
                              💰 Ingreso
                            </span>
                          )}
                          {expense.moneda_original === 'USD' && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/35 text-blue-300 text-xs rounded font-medium">
                              💵 USD
                            </span>
                          )}
                          <span className="text-xs text-zinc-500">•</span>
                          <p className="text-xs text-zinc-500">{formatDate(expense.fecha)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className={`text-base font-bold ${expense.es_entrada ? 'text-emerald-300' : 'text-blue-300'}`}>{formatCurrency(expense.monto)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(expense, 'gastos')}
                          className="p-1.5 text-blue-300 hover:bg-blue-500/15 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDeleteModal(expense, 'gastos')}
                          className="p-1.5 text-rose-300 hover:bg-rose-500/15 rounded transition-colors"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            {hasActiveFilters || yearFilter !== 'all' ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-bold text-zinc-400 mb-1">No se encontraron resultados</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  No hay gastos que coincidan con los filtros aplicados
                  {yearFilter !== 'all' && ` para ${filterLabel}`}
                </p>
                <div className="flex gap-2 justify-center">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  {yearFilter !== 'all' && (
                    <button
                      onClick={() => handleYearFilterChange('all')}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver todos los años
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">💰</div>
                <h3 className="text-sm font-bold text-zinc-400 mb-1">No hay gastos registrados</h3>
                <p className="text-xs text-zinc-500">Comienza agregando tu primer gasto</p>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Renderizar supermercado
  const renderSupermercado = () => {
    return (
      <div className="space-y-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          filteredDataLength={filteredData.length}
          totalDataLength={supermarketByYear.length}
          hasActiveFilters={hasActiveFilters}
          onPageChange={handlePageChange}
        />
        
        {filteredData.length > 0 ? (
          <div className="space-y-2">
            {paginatedData.map((purchase) => (
              <div key={purchase.id} className="glass-card rounded-lg p-3 hover:shadow-md transition-all">
                {editingItem && editingItem.id === purchase.id && editingItem.type === 'supermercado' ? (
                  <EditForm
                    editingItem={editingItem}
                    editForm={editForm}
                    onFormChange={handleFormChange}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-zinc-800/50 rounded-lg flex-shrink-0">
                        <span className="text-lg">{getSupermarketIcon(purchase.supermercado)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-100 truncate">{purchase.descripcion}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-zinc-400">{purchase.supermercado}</p>
                          <span className="text-xs text-zinc-500">•</span>
                          <p className="text-xs text-zinc-500">{formatDate(purchase.fecha)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-emerald-300">{formatCurrency(purchase.monto)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(purchase, 'supermercado')}
                          className="p-1.5 text-blue-300 hover:bg-blue-500/15 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => openDeleteModal(purchase, 'supermercado')}
                          className="p-1.5 text-rose-300 hover:bg-rose-500/15 rounded transition-colors"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            {hasActiveFilters || yearFilter !== 'all' ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-bold text-zinc-400 mb-1">No se encontraron resultados</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  No hay compras que coincidan con los filtros aplicados
                  {yearFilter !== 'all' && ` para ${filterLabel}`}
                </p>
                <div className="flex gap-2 justify-center">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  {yearFilter !== 'all' && (
                    <button
                      onClick={() => handleYearFilterChange('all')}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver todos los años
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="text-sm font-bold text-zinc-400 mb-1">No hay compras registradas</h3>
                <p className="text-xs text-zinc-500">Comienza registrando tu primera compra de supermercado</p>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Renderizar cortes
  const renderCortes = () => {
    return (
      <div className="space-y-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          filteredDataLength={filteredData.length}
          totalDataLength={cutsByYear.length}
          hasActiveFilters={hasActiveFilters}
          onPageChange={handlePageChange}
        />
        
        {filteredData.length > 0 ? (
          <div className="space-y-2">
            {paginatedData.map((cut) => (
              <div key={cut.id} className="glass-card rounded-lg p-3 hover:shadow-md transition-all">
                {editingItem && editingItem.id === cut.id && editingItem.type === 'cortes' ? (
                  <EditForm
                    editingItem={editingItem}
                    editForm={editForm}
                    cutTypes={cutTypes}
                    onFormChange={handleFormChange}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-zinc-800/50 rounded-lg flex-shrink-0">
                        <span className="text-lg">{getCutIcon(cut.tipo_corte)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-100 truncate">{cut.tipo_corte}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-zinc-400">Corte registrado</p>
                          <span className="text-xs text-zinc-500">•</span>
                          <p className="text-xs text-zinc-500">{formatDate(cut.fecha)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(cut, 'cortes')}
                        className="p-1.5 text-blue-300 hover:bg-blue-500/15 rounded transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => openDeleteModal(cut, 'cortes')}
                        className="p-1.5 text-rose-300 hover:bg-rose-500/15 rounded transition-colors"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            {hasActiveFilters || yearFilter !== 'all' ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-bold text-zinc-400 mb-1">No se encontraron resultados</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  No hay cortes que coincidan con los filtros aplicados
                  {yearFilter !== 'all' && ` para ${filterLabel}`}
                </p>
                <div className="flex gap-2 justify-center">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                  {yearFilter !== 'all' && (
                    <button
                      onClick={() => handleYearFilterChange('all')}
                      className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver todos los años
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">💇</div>
                <h3 className="text-sm font-bold text-zinc-400 mb-1">No hay cortes registrados</h3>
                <p className="text-xs text-zinc-500">Comienza registrando tu primer corte</p>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gastos':
        return renderGastos()
      case 'supermercado':
        return renderSupermercado()
      case 'cortes':
        return renderCortes()
      default:
        return renderGastos()
    }
  }

  // Calcular totales (filtrados por año)
  const totalGastos = expensesByYear.reduce((sum, exp) => sum + exp.monto, 0)
  const totalSupermercado = supermarketByYear.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">📋 Ver Datos</h2>
            {yearFilter !== 'all' && (
              <p className="text-sm text-sky-400/90 mt-1">
                Mostrando: {filterLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <div className="flex items-center gap-2 text-blue-300 text-xs">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Actualizando...</span>
              </div>
            )}
            <button
              onClick={downloadCSV}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 transition-colors"
              title="Descargar datos en CSV"
            >
              <span aria-hidden>📊</span>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Año */}
      <YearSelector
        yearFilter={yearFilter}
        selectedYear={selectedYear}
        currentYear={currentYear}
        previousYears={previousYears}
        availableYears={availableYears}
        onFilterChange={handleYearFilterChange}
        showStats={true}
        statsByYear={statsByYear}
      />

      {/* Estadísticas Rápidas Compactas (filtradas por año) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card rounded-xl p-3 border-l-4 border-l-sky-500/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-1">
                Total gastos {yearFilter !== 'all' && <span className="text-sky-400/80">({filterLabel})</span>}
              </p>
              <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{formatCurrency(totalGastos)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{expensesByYear.length} registros</p>
            </div>
            <span className="text-2xl flex-shrink-0 opacity-80" aria-hidden>💰</span>
          </div>
        </div>

        <div className="stat-card rounded-xl p-3 border-l-4 border-l-emerald-500/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-1">
                Total supermercado {yearFilter !== 'all' && <span className="text-emerald-400/80">({filterLabel})</span>}
              </p>
              <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{formatCurrency(totalSupermercado)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{supermarketByYear.length} compras</p>
            </div>
            <span className="text-2xl flex-shrink-0 opacity-80" aria-hidden>🛒</span>
          </div>
        </div>

        <div className="stat-card rounded-xl p-3 border-l-4 border-l-violet-500/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-1">
                Total cortes {yearFilter !== 'all' && <span className="text-violet-400/80">({filterLabel})</span>}
              </p>
              <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{cutsByYear.length}</p>
              <p className="text-xs text-zinc-500 mt-0.5">cortes</p>
            </div>
            <span className="text-2xl flex-shrink-0 opacity-80" aria-hidden>💇</span>
          </div>
        </div>

        <div className="stat-card rounded-xl p-3 border-l-4 border-l-orange-500/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-500 mb-1">Visibles (filtrados)</p>
              <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{filteredData.length}</p>
              <p className="text-xs text-zinc-500 mt-0.5">de {getCurrentTabData().length}</p>
            </div>
            <span className="text-2xl opacity-80" aria-hidden>🔍</span>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <SearchBar
        searchFilters={searchFilters}
        activeTab={activeTab}
        availableCategories={availableCategories}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        filteredDataLength={filteredData.length}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={clearFilters}
      />

      {/* Tabs Compactos */}
      <div className={`glass-card rounded-xl p-4 transition-all ${refreshing ? 'opacity-75' : 'opacity-100'}`}>
            <div className="flex gap-2 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md border-blue-500/50'
                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:text-zinc-200'
              } ${refreshing ? 'animate-pulse' : ''}`}
            >
              <span className="text-base" aria-hidden>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-blue-500/90 text-white' : 'bg-zinc-700 text-zinc-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Contenido de Tabs */}
        <div className={`min-h-[400px] transition-all ${refreshing ? 'opacity-50' : 'opacity-100'}`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-zinc-400">Cargando datos...</span>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="¿Eliminar este registro?"
        message="Esta acción no se puede deshacer."
        itemName={deleteModal.itemName}
      />

      {/* Modal de confirmación de edición */}
      <DeleteConfirmModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        onConfirm={confirmEdit}
        title="¿Editar este registro?"
        message="Ingresa tu PIN para continuar con la edición."
        itemName={editModal.itemName}
        actionType="edit"
      />
    </div>
  )
}

export default ViewData
