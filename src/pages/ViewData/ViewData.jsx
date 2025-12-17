import React, { useState, useCallback, useMemo } from 'react'
import { useViewData } from './hooks/useViewData'
import { useDataPagination } from './hooks/useDataPagination'
import { useViewDataFilters } from './hooks/useViewDataFilters'
import SearchBar from './components/SearchBar'
import Pagination from './components/Pagination'
import EditForm from './components/EditForm'
import { formatCurrency, formatDate, convertToCSV } from './utils/viewDataFormatters'
import { getCategoryIcon, getSupermarketIcon, getCutIcon, downloadCSVFile } from './utils/viewDataHelpers'
import notifications from '../../utils/services/notifications'
import DateInput from '../../components/DateInput'

const ViewData = ({ onDataChanged }) => {
  const [activeTab, setActiveTab] = useState('gastos')
  const itemsPerPage = 25

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

  // Obtener datos del tab actual
  const getCurrentTabData = useCallback(() => {
    switch (activeTab) {
      case 'gastos':
        return expenses
      case 'supermercado':
        return supermarketPurchases
      case 'cortes':
        return cuts
      default:
        return []
    }
  }, [activeTab, expenses, supermarketPurchases, cuts])

  // Datos filtrados
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

  // Resetear página cuando cambie de tab o filtros
  React.useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, filteredData.length, setCurrentPage])

  // Manejar cambios en el formulario de edición
  const handleFormChange = useCallback((updates) => {
    setEditForm(prev => ({ ...prev, ...updates }))
  }, [setEditForm])

  // Descargar CSV
  const downloadCSV = useCallback(() => {
    const currentData = getCurrentTabData()
    const csvContent = convertToCSV(currentData, activeTab)
    
    if (!csvContent) {
      notifications.showSync('❌ No hay datos para descargar', 'error')
      return
    }

    const filename = `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    if (downloadCSVFile(csvContent, filename)) {
      notifications.showSync('✅ Archivo CSV descargado correctamente', 'success')
    }
  }, [activeTab, getCurrentTabData])

  const cutTypes = [
    'Corte básico', 'Corte y peinado', 'Corte + barba', 
    'Corte + tinte', 'Corte + mechas', 'Tratamiento capilar', 'Otros'
  ]

  const tabs = [
    { id: 'gastos', label: 'Gastos', icon: '💰', count: expenses.length },
    { id: 'supermercado', label: 'Supermercado', icon: '🛒', count: supermarketPurchases.length },
    { id: 'cortes', label: 'Cortes', icon: '💇', count: cuts.length }
  ]

  // Renderizar gastos
  const renderGastos = () => {
    return (
      <div className="space-y-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          filteredDataLength={filteredData.length}
          totalDataLength={expenses.length}
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
                      <div className={`p-2 rounded-lg flex-shrink-0 ${expense.es_entrada ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <span className="text-lg">{getCategoryIcon(expense)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{expense.descripcion}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-600">{expense.categoria_nombre}</p>
                          {expense.es_entrada && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">
                              💰 Ingreso
                            </span>
                          )}
                          {expense.moneda_original === 'USD' && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                              💵 USD
                            </span>
                          )}
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-500">{formatDate(expense.fecha)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-blue-600">{formatCurrency(expense.monto)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(expense, 'gastos')}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(expense.id, 'gastos')}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
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
            {hasActiveFilters ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No se encontraron resultados</h3>
                <p className="text-xs text-gray-500 mb-3">No hay gastos que coincidan con los filtros aplicados</p>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">💰</div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No hay gastos registrados</h3>
                <p className="text-xs text-gray-500">Comienza agregando tu primer gasto</p>
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
          totalDataLength={supermarketPurchases.length}
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
                      <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                        <span className="text-lg">{getSupermarketIcon(purchase.supermercado)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{purchase.descripcion}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-600">{purchase.supermercado}</p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-500">{formatDate(purchase.fecha)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-green-600">{formatCurrency(purchase.monto)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(purchase, 'supermercado')}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(purchase.id, 'supermercado')}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
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
            {hasActiveFilters ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No se encontraron resultados</h3>
                <p className="text-xs text-gray-500 mb-3">No hay compras que coincidan con los filtros aplicados</p>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No hay compras registradas</h3>
                <p className="text-xs text-gray-500">Comienza registrando tu primera compra de supermercado</p>
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
          totalDataLength={cuts.length}
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
                      <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                        <span className="text-lg">{getCutIcon(cut.tipo_corte)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-800 truncate">{cut.tipo_corte}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-600">Corte registrado</p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-500">{formatDate(cut.fecha)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(cut, 'cortes')}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteItem(cut.id, 'cortes')}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
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
            {hasActiveFilters ? (
              <>
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No se encontraron resultados</h3>
                <p className="text-xs text-gray-500 mb-3">No hay cortes que coincidan con los filtros aplicados</p>
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">💇</div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No hay cortes registrados</h3>
                <p className="text-xs text-gray-500">Comienza registrando tu primer corte</p>
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

  // Calcular totales
  const totalGastos = expenses.reduce((sum, exp) => sum + exp.monto, 0)
  const totalSupermercado = supermarketPurchases.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">📋 Ver Datos</h2>
          <div className="flex items-center gap-2">
            {refreshing && (
              <div className="flex items-center gap-2 text-blue-600 text-xs">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Actualizando...</span>
              </div>
            )}
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              title="Descargar datos en CSV"
            >
              <span>📊</span>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas Compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Gastos</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalGastos)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{expenses.length} registros</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Supermercado</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalSupermercado)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{supermarketPurchases.length} compras</p>
            </div>
            <span className="text-2xl">🛒</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Cortes</p>
              <p className="text-lg font-bold text-purple-700">{cuts.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">cortes</p>
            </div>
            <span className="text-2xl">💇</span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Filtrados</p>
              <p className="text-lg font-bold text-orange-700">{filteredData.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">de {getCurrentTabData().length}</p>
            </div>
            <span className="text-2xl">🔍</span>
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
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${refreshing ? 'animate-pulse' : ''}`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-blue-500' : 'bg-gray-300'
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
              <span className="ml-3 text-sm text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewData
