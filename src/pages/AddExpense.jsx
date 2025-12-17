import React, { useState, useEffect } from 'react'
import notifications from '../utils/services/notifications'
import database from '../database/index.js'
import DateInput from '../components/DateInput'
import { formatDateLocal, getTodayLocal } from '../utils/normalizers'

const AddExpense = ({ onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'LPS',
    category: '',
    description: '',
    date: formatDateLocal(getTodayLocal()),
    es_entrada: false
  })

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Cargar categorías existentes desde la base de datos
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const cats = await database.getCategories()
        // Mapear categorías de la base de datos al formato esperado
        const mappedCategories = cats.map(cat => ({
          id: cat.id,
          label: cat.name || cat.nombre || '',
          icon: cat.icon || '💰',
          color: cat.color || '#3498db'
        }))
        setCategories(mappedCategories)
      } catch (error) {
        console.error('Error loading categories:', error)
        notifications.showSync('Error al cargar categorías', 'error')
        // Fallback a categorías por defecto si hay error
        setCategories([
          { id: 1, label: 'Comida', icon: '🍽️', color: '#ff6b6b' },
          { id: 2, label: 'Transporte', icon: '🚌', color: '#4ecdc4' },
          { id: 3, label: 'Entretenimiento', icon: '🎮', color: '#45b7d1' },
          { id: 4, label: 'Regalos', icon: '🎁', color: '#96ceb4' },
          { id: 5, label: 'Utilidades', icon: '⚡', color: '#feca57' },
          { id: 6, label: 'Salud', icon: '🏥', color: '#ff9ff3' },
          { id: 7, label: 'Educación', icon: '📚', color: '#54a0ff' },
          { id: 8, label: 'Tecnología', icon: '💻', color: '#5f27cd' },
          { id: 9, label: 'Otros', icon: '📦', color: '#a55eea' }
        ])
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar datos
      if (!formData.amount || !formData.category || !formData.description) {
        notifications.showSync('Por favor, completa todos los campos requeridos.', 'error')
        setLoading(false)
        return
      }

      // Convertir monto si es necesario
      let finalAmount = parseFloat(formData.amount)
      if (formData.currency === 'USD') {
        const exchangeRate = await database.getConfig('tasa_cambio_usd')
        const rate = exchangeRate ? parseFloat(exchangeRate) : 26.18
        finalAmount = finalAmount * rate
      }

      // Validar que la categoría seleccionada existe
      const selectedCategory = categories.find(cat => cat.id === formData.category || cat.id === parseInt(formData.category))
      if (!selectedCategory) {
        notifications.showSync('Por favor, selecciona una categoría válida.', 'error')
        setLoading(false)
        return
      }

      // Crear gasto en la base de datos
      const expenseData = {
        fecha: formData.date,
        monto: finalAmount,
        categoria_id: selectedCategory.id,
        descripcion: formData.description,
        es_entrada: formData.es_entrada,
        moneda_original: formData.currency // ✅ Guardar moneda original
      }

      // Obtener total de gastos actual para la notificación
      const allExpenses = await database.getExpenses()
      const gastos = allExpenses.filter(expense => !expense.es_entrada)
      const ingresos = allExpenses.filter(expense => expense.es_entrada)
      const totalGastos = gastos.reduce((sum, expense) => sum + expense.monto, 0)
      const totalIngresos = ingresos.reduce((sum, expense) => sum + expense.monto, 0)
      const totalActual = totalGastos - totalIngresos

      await database.createExpense(expenseData)
      
      // Limpiar formulario manteniendo la fecha anterior
      setFormData({
        amount: '',
        currency: 'LPS',
        category: '',
        description: '',
        date: formData.date, // ✅ Mantener la fecha que el usuario había seleccionado
        es_entrada: false // ✅ Resetear el checkbox a false
      })

      // Mostrar notificación de progreso
      const categoryName = selectedCategory?.label || formData.category
      notifications.showExpenseProgress(
        {
          amount: finalAmount,
          category: categoryName,
          description: formData.description
        },
        totalActual + finalAmount, // Total actual + el nuevo gasto
        () => {
          // Callback cuando se cierra la notificación
          if (onExpenseAdded) {
            onExpenseAdded()
          }
        }
      )
    } catch (error) {
      console.error('Error saving expense:', error)
      notifications.showSync('❌ Error al guardar el gasto', 'error')
    } finally {
      setLoading(false)
    }
  }


  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.category || cat.id === parseInt(formData.category))
  }

  const calculateConvertedAmount = () => {
    if (!formData.amount || formData.currency === 'LPS') {
      return formData.amount
    }
    
    // Tasa de cambio USD a LPS (esto vendrá de la configuración)
    const exchangeRate = 26.18
    return (parseFloat(formData.amount) * exchangeRate).toFixed(2)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">➕ Agregar Gasto</h2>
        <p className="text-gray-600">Registra un nuevo gasto en tu sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Monto y Moneda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 Monto
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💱 Moneda
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="LPS">LPS (Lempiras)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>
              </div>

              {/* Conversión automática */}
              {formData.currency === 'USD' && formData.amount && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className="text-lg">💱</span>
                    <span className="font-medium">
                      Conversión automática: ${formData.amount} USD = L {calculateConvertedAmount()} LPS
                    </span>
                  </div>
                </div>
              )}

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  🏷️ Categoría
                </label>
                {loadingCategories ? (
                  <div className="text-center py-4 text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm">Cargando categorías...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      ⚠️ No hay categorías disponibles. Por favor, crea categorías en <strong>Configuración → Categorías</strong>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.category === category.id || formData.category === String(category.id)
                            ? 'border-slate-400 bg-slate-50'
                            : 'border-gray-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <div className="font-medium text-gray-800">{category.label}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Descripción
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descripción del gasto..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Fecha */}
              <DateInput
                label="📅 Fecha del Gasto"
                value={formData.date}
                onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                required
              />

              {/* Checkbox para entrada de dinero */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <input
                  type="checkbox"
                  id="es_entrada"
                  checked={formData.es_entrada}
                  onChange={(e) => setFormData(prev => ({ ...prev, es_entrada: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="es_entrada" className="text-sm font-medium text-gray-700 cursor-pointer">
                  💰 Es una entrada de dinero (ingreso)
                </label>
              </div>

              {/* Información sobre el checkbox */}
              {formData.es_entrada && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600">ℹ️</span>
                    <span className="text-sm text-green-700">
                      Esta cantidad se restará de tus gastos totales (será tratada como un ingreso)
                    </span>
                  </div>
                </div>
              )}

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading || !formData.amount || !formData.category}
                className="w-full gradient-button text-white py-4 rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  '💾 Guardar Gasto'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          {/* Categoría seleccionada */}
          {formData.category && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Resumen</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-2xl">{getSelectedCategory()?.icon}</span>
                  <div>
                    <div className="font-medium text-gray-800">{getSelectedCategory()?.label}</div>
                    <div className="text-sm text-gray-600">Categoría seleccionada</div>
                  </div>
                </div>
                
                {formData.amount && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-600 mb-1">Monto</div>
                    <div className="font-bold text-slate-800">
                      {formData.currency} {parseFloat(formData.amount).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consejos */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Consejos</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-slate-500 mt-1">💡</span>
                <span>Usa descripciones claras para identificar mejor tus gastos</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-slate-500 mt-1">💰</span>
                <span>Los USD se convierten automáticamente a LPS</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-slate-500 mt-1">📊</span>
                <span>Las categorías te ayudan a analizar tus gastos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddExpense
