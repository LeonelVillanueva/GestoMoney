import React, { useState, useEffect, useMemo } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'
import CustomDatePicker from '../components/CustomDatePicker'
import AsyncStatePanel from '../components/AsyncStatePanel'
import { formatDateLocal, getTodayLocal } from '../utils/normalizers'
import { useYearFilter } from '../hooks/useYearFilter'
import YearSelector from '../components/YearSelector'

const Supermarket = ({ onDataAdded }) => {
  const [formData, setFormData] = useState({
    fecha: formatDateLocal(getTodayLocal()),
    monto: '',
    supermercado: '',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [purchasesError, setPurchasesError] = useState('')
  const [purchases, setPurchases] = useState([])
  const [supermarkets, setSupermarkets] = useState(['La Colonia', 'Walmart'])

  // Hook para filtro de año
  const {
    yearFilter,
    selectedYear,
    currentYear,
    availableYears,
    previousYears,
    filterLabel,
    filteredData: purchasesByYear,
    statsByYear,
    handleYearFilterChange
  } = useYearFilter(purchases)

  useEffect(() => {
    loadPurchases()
    loadSupermarkets()
  }, [])

  const loadSupermarkets = async () => {
    try {
      const config = await database.getAllConfig()
      const markets = JSON.parse(config.supermercados_por_defecto || '["La Colonia", "Walmart"]')
      setSupermarkets(markets)
      
      // Establecer el primer supermercado como valor por defecto
      if (markets.length > 0 && !formData.supermercado) {
        setFormData(prev => ({ ...prev, supermercado: markets[0] }))
      }
    } catch (error) {
      console.error('Error loading supermarkets:', error)
      // Fallback a supermercados por defecto
      setSupermarkets(['La Colonia', 'Walmart'])
      setFormData(prev => ({ ...prev, supermercado: 'La Colonia' }))
    }
  }

  const loadPurchases = async () => {
    setLoadingPurchases(true)
    setPurchasesError('')
    try {
      const data = await database.getSupermarketPurchases()
      setPurchases(data)
    } catch (error) {
      console.error('Error loading purchases:', error)
      setPurchasesError('No se pudieron cargar las compras de supermercado.')
      notifications.showSync('Error al cargar compras de supermercado', 'error')
    } finally {
      setLoadingPurchases(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.monto || !formData.descripcion) {
        notifications.showSync('Por favor, completa todos los campos requeridos.', 'error')
        return
      }

      const purchaseData = {
        fecha: formData.fecha,
        monto: parseFloat(formData.monto),
        supermercado: formData.supermercado,
        descripcion: formData.descripcion
      }

      const createResult = await database.createSupermarketPurchase(purchaseData)
      
      // Limpiar formulario
      setFormData({
        fecha: formatDateLocal(getTodayLocal()),
        monto: '',
        supermercado: 'La Colonia',
        descripcion: ''
      })

      // Recargar compras
      await loadPurchases()

      // Notificar que se agregó
      if (onDataAdded) {
        onDataAdded({ scope: 'expenses', source: 'supermarket' })
      }

      if (createResult?.queued) {
        notifications.showSync('Sin conexión: la compra quedó pendiente de sincronización.', 'warning')
      } else {
        notifications.showSync('✅ Compra de supermercado registrada exitosamente', 'success')
      }
    } catch (error) {
      console.error('Error saving purchase:', error)
      notifications.showSync('❌ Error al guardar la compra', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Función para formatear fechas sin problemas de zona horaria
  const formatDate = (dateString) => {
    if (!dateString) return ''
    
    try {
      // Si es un string en formato YYYY-MM-DD, parsearlo directamente
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-')
        return new Date(year, month - 1, day).toLocaleDateString('es-HN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
      
      // Si es una fecha válida, formatearla
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Fecha inválida'
      
      return date.toLocaleDateString('es-HN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Fecha inválida'
    }
  }

  const getSupermarketIcon = (supermercado) => {
    const iconMap = {
      'La Colonia': '🏪',
      'Walmart': '🏬',
      'Price Smart': '🏢',
      'Maxi Despensa': '🏪',
      'Diunsa': '🏬',
      'Supermercado': '🏪'
    }
    return iconMap[supermercado] || '🏪'
  }

  // Calcular estadísticas (usando datos filtrados por año)
  const totalGastado = purchasesByYear.reduce((sum, p) => sum + p.monto, 0)
  const promedioCompra = purchasesByYear.length > 0 ? totalGastado / purchasesByYear.length : 0
  const ultimaCompra = purchasesByYear.length > 0 ? purchasesByYear[0] : null
  const comprasPorSupermercado = useMemo(() => {
    return supermarkets.map(market => {
      const compras = purchasesByYear.filter(p => p.supermercado === market)
      return {
        nombre: market,
        total: compras.reduce((sum, p) => sum + p.monto, 0),
        cantidad: compras.length
      }
    })
  }, [purchasesByYear, supermarkets])

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">🛒 Compras de Supermercado</h2>
            {yearFilter !== 'all' && (
              <p className="text-sm text-sky-400/90 mt-1">
                Mostrando: {filterLabel}
              </p>
            )}
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
        showStats={false}
      />

      {/* Estadísticas Rápidas Compactas */}
      {purchasesByYear.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="stat-card rounded-xl p-3 border-l-4 border-l-sky-500/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 mb-1">
                  Total gastado {yearFilter !== 'all' && <span className="text-sky-400/80">({filterLabel})</span>}
                </p>
                <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{formatCurrency(totalGastado)}</p>
              </div>
              <span className="text-2xl flex-shrink-0 opacity-80" aria-hidden>💰</span>
            </div>
          </div>
          
          <div className="stat-card rounded-xl p-3 border-l-4 border-l-emerald-500/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 mb-1">Promedio</p>
                <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{formatCurrency(promedioCompra)}</p>
              </div>
              <span className="text-2xl flex-shrink-0 opacity-80" aria-hidden>📊</span>
            </div>
          </div>

          <div className="stat-card rounded-xl p-3 border-l-4 border-l-violet-500/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500 mb-1">Total compras</p>
                <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{purchasesByYear.length}</p>
              </div>
              <span className="text-2xl flex-shrink-0 opacity-80" aria-hidden>🛒</span>
            </div>
          </div>

          {ultimaCompra && (
            <div className="stat-card rounded-xl p-3 border-l-4 border-l-orange-500/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 mb-1">Última compra</p>
                  <p className="text-base sm:text-lg font-bold text-zinc-100 break-words leading-tight">{formatCurrency(ultimaCompra.monto)}</p>
                </div>
                <span className="text-2xl flex-shrink-0">{getSupermarketIcon(ultimaCompra.supermercado)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario de Compra Compacto */}
        <div className="lg:col-span-1 glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-4">➕ Nueva Compra</h3>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                📅 Fecha
              </label>
              <CustomDatePicker
                value={formData.fecha}
                onChange={(fecha) => setFormData(prev => ({ ...prev, fecha }))}
                placeholder="Seleccionar fecha"
                type="date"
              />
            </div>

            {/* Monto y Supermercado en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  💰 Monto
                </label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  🏪 Tienda
                </label>
                <select
                  name="supermercado"
                  value={formData.supermercado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {supermarkets.map((market, index) => (
                    <option key={index} value={market}>
                      {getSupermarketIcon(market)} {market}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                📝 Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Ej: Comida semanal..."
                required
                rows="2"
                className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Botón de Guardar */}
            <button
              type="submit"
              className="gradient-button text-white w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Registrar</span>
                  <span>🛒</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Compras Recientes Compacta */}
        <div className="lg:col-span-2 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-zinc-100">📋 Compras Recientes</h3>
            {purchasesByYear.length > 0 && (
              <span className="text-xs text-gray-500">{purchasesByYear.length} compras</span>
            )}
          </div>
          
          {loadingPurchases ? (
            <AsyncStatePanel
              kind="loading"
              title="Cargando compras"
              message="Obteniendo tus registros de supermercado..."
            />
          ) : purchasesError ? (
            <AsyncStatePanel
              kind="error"
              title="Error al cargar compras"
              message={purchasesError}
              actionLabel="Reintentar"
              onAction={loadPurchases}
            />
          ) : purchasesByYear.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {purchasesByYear.slice(0, 10).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/60 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-1.5 bg-zinc-900 rounded-lg flex-shrink-0">
                      <span className="text-lg">{getSupermarketIcon(purchase.supermercado)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-100 truncate">{purchase.descripcion}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-zinc-400">{purchase.supermercado}</p>
                        <span className="text-gray-400">•</span>
                        <p className="text-xs text-zinc-400">{formatDate(purchase.fecha)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-zinc-100">{formatCurrency(purchase.monto)}</p>
                  </div>
                </div>
              ))}
              {purchasesByYear.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">Y {purchasesByYear.length - 10} compras más...</p>
                </div>
              )}
            </div>
          ) : (
            <AsyncStatePanel
              kind="empty"
              title="No hay compras registradas"
              message="Registra tu primera compra usando el formulario."
            />
          )}
        </div>
      </div>

      {/* Estadísticas por Supermercado */}
      {purchases.length > 0 && comprasPorSupermercado.some(c => c.cantidad > 0) && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 mb-3">📊 Por Supermercado</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {comprasPorSupermercado.map((item, index) => {
              if (item.cantidad === 0) return null
              const accent = [
                'border-l-emerald-500/50',
                'border-l-orange-500/50',
                'border-l-sky-500/50',
                'border-l-violet-500/50',
                'border-l-rose-500/50'
              ]
              return (
                <div
                  key={index}
                  className={`stat-card rounded-lg p-3 border-l-4 ${accent[index % accent.length]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{getSupermarketIcon(item.nombre)}</span>
                    <span className="text-xs font-medium text-zinc-400">{item.cantidad} compras</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-1">{item.nombre}</p>
                  <p className="text-base font-bold text-zinc-100">{formatCurrency(item.total)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Supermarket
