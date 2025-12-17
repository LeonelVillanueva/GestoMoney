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
          <div className="space-y-3">
            {paginatedData.map((expense) => (
              <div key={expense.id} className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
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
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${expense.es_entrada ? 'bg-green-100' : 'bg-white'}`}>
                        <span className="text-2xl">{getCategoryIcon(expense)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{expense.descripcion}</h4>
                        <div className="flex items-center space-x-2">
                          <p className="text-sm text-gray-600">{expense.categoria_nombre}</p>
                          {expense.es_entrada && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              💰 Ingreso
                            </span>
                          )}
                          {expense.moneda_original === 'USD' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              💵 USD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(expense.fecha)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(expense.monto)}</p>
                        <p className="text-xs text-gray-500">LPS</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(expense, 'gastos')}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(expense.id, 'gastos')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500 mb-4">No hay gastos que coincidan con los filtros aplicados</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No hay gastos registrados</h3>
                <p className="text-gray-500">Comienza agregando tu primer gasto</p>
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
          <div className="space-y-3">
            {paginatedData.map((purchase) => (
              <div key={purchase.id} className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
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
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white rounded-lg">
                        <span className="text-2xl">{getSupermarketIcon(purchase.supermercado)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{purchase.descripcion}</h4>
                        <p className="text-sm text-gray-600">{purchase.supermercado}</p>
                        <p className="text-xs text-gray-500">{formatDate(purchase.fecha)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">{formatCurrency(purchase.monto)}</p>
                        <p className="text-xs text-gray-500">LPS</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(purchase, 'supermercado')}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(purchase.id, 'supermercado')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500 mb-4">No hay compras que coincidan con los filtros aplicados</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No hay compras registradas</h3>
                <p className="text-gray-500">Comienza registrando tu primera compra de supermercado</p>
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
          <div className="space-y-3">
            {paginatedData.map((cut) => (
              <div key={cut.id} className="glass-card rounded-xl p-4 hover:shadow-lg transition-all">
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
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white rounded-lg">
                        <span className="text-2xl">{getCutIcon(cut.tipo_corte)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{cut.tipo_corte}</h4>
                        <p className="text-sm text-gray-600">Corte registrado</p>
                        <p className="text-xs text-gray-500">{formatDate(cut.fecha)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <span className="text-sm font-medium text-purple-600">Registrado</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(cut, 'cortes')}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(cut.id, 'cortes')}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
          <div className="text-center py-12">
            {hasActiveFilters ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500 mb-4">No hay cortes que coincidan con los filtros aplicados</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💇</div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">No hay cortes registrados</h3>
                <p className="text-gray-500">Comienza registrando tu primer corte</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">📋 Ver Datos</h2>
            <p className="text-gray-600">Visualiza todos tus datos registrados organizados por categorías</p>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center space-x-3">
            {/* Botón de descarga CSV */}
            <button
              onClick={downloadCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              title="Descargar datos en CSV"
            >
              <span>📊</span>
              <span>Descargar CSV</span>
            </button>
            
            {/* Indicador de refresh */}
            {refreshing && (
              <div className="flex items-center space-x-2 text-blue-600 animate-pulse">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm font-medium">Actualizando...</span>
              </div>
            )}
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

      {/* Tabs */}
      <div className={`glass-card rounded-2xl p-6 transition-all ${refreshing ? 'opacity-75' : 'opacity-100'}`}>
        <div className="flex space-x-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } ${refreshing ? 'animate-pulse' : ''}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Total Gastos</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(expenses.reduce((sum, exp) => sum + exp.monto, 0))}
          </p>
          <p className="text-sm text-gray-500">{expenses.length} registros</p>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Total Supermercado</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(supermarketPurchases.reduce((sum, p) => sum + p.monto, 0))}
          </p>
          <p className="text-sm text-gray-500">{supermarketPurchases.length} compras</p>
        </div>

        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">💇</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Total Cortes</h3>
          <p className="text-2xl font-bold text-purple-600">{cuts.length}</p>
          <p className="text-sm text-gray-500">cortes registrados</p>
        </div>
      </div>
    </div>
  )
}

export default ViewData
