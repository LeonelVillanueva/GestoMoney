import React, { useState, useEffect } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'
import DateInput from '../components/DateInput'
import { formatDateLocal, getTodayLocal } from '../utils/normalizers'

const Supermarket = ({ onDataAdded }) => {
  const [formData, setFormData] = useState({
    fecha: formatDateLocal(getTodayLocal()),
    monto: '',
    supermercado: '',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [supermarkets, setSupermarkets] = useState(['La Colonia', 'Walmart'])

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
    try {
      const data = await database.getSupermarketPurchases()
      setPurchases(data)
    } catch (error) {
      console.error('Error loading purchases:', error)
      notifications.showSync('Error al cargar compras de supermercado', 'error')
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

      await database.createSupermarketPurchase(purchaseData)
      
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
        onDataAdded()
      }

      notifications.showSync('✅ Compra de supermercado registrada exitosamente', 'success')
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🛒 Compras de Supermercado</h2>
        <p className="text-gray-600">Registra tus compras en los supermercados configurados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Compra */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">➕ Nueva Compra</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha */}
            <DateInput
              label="📅 Fecha de Compra"
              value={formData.fecha}
              onChange={(fecha) => setFormData(prev => ({ ...prev, fecha }))}
              required
            />

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💰 Monto Total
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Supermercado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏪 Supermercado
              </label>
              <select
                name="supermercado"
                value={formData.supermercado}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                {supermarkets.map((market, index) => (
                  <option key={index} value={market}>
                    {getSupermarketIcon(market)} {market}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Descripción de la Compra
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Ej: Comida semanal, productos de limpieza, etc."
                required
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Botón de Guardar */}
            <button
              type="submit"
              className="gradient-button text-white w-full py-3 rounded-lg text-lg font-semibold flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Registrar Compra</span>
                  <span>🛒</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Compras Recientes */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📋 Compras Recientes</h3>
          
          {purchases.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg">
                      <span className="text-xl">{getSupermarketIcon(purchase.supermercado)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{purchase.descripcion}</h4>
                      <p className="text-sm text-gray-600">{purchase.supermercado}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(purchase.monto)}</p>
                    <p className="text-sm text-gray-600">{formatDate(purchase.fecha)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No hay compras registradas</h3>
              <p className="text-gray-500">Comienza registrando tu primera compra de supermercado</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Estadísticas Rápidas</h3>
        
        {purchases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h4 className="text-lg font-bold text-gray-800">Total Gastado</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(purchases.reduce((sum, p) => sum + p.monto, 0))}
              </p>
            </div>
            
            {supermarkets.map((market, index) => {
              const total = purchases.filter(p => p.supermercado === market).reduce((sum, p) => sum + p.monto, 0)
              const colors = ['text-green-600', 'text-orange-600', 'text-blue-600', 'text-purple-600', 'text-red-600']
              const colorClass = colors[index % colors.length]
              
              return (
                <div key={index} className="text-center">
                  <div className="text-3xl mb-2">{getSupermarketIcon(market)}</div>
                  <h4 className="text-lg font-bold text-gray-800">{market}</h4>
                  <p className={`text-2xl font-bold ${colorClass}`}>
                    {formatCurrency(total)}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500">Las estadísticas aparecerán cuando registres compras</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Supermarket
