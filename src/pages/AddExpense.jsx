import React, { useState, useEffect } from 'react'
import notifications from '../utils/services/notifications'
import database from '../database/index.js'
import CustomDatePicker from '../components/CustomDatePicker'
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
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-2xl font-bold text-gray-800">➕ Agregar Gasto</h2>
        <p className="text-sm text-gray-500 mt-1">Registra un nuevo gasto o ingreso</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario Reorganizado */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Primera fila: Monto, Moneda y Tipo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    💱 Moneda
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="LPS">LPS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {/* Conversión automática compacta */}
              {formData.currency === 'USD' && formData.amount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span>💱</span>
                    <span className="font-medium">
                      ${formData.amount} USD = L {calculateConvertedAmount()} LPS
                    </span>
                  </div>
                </div>
              )}

              {/* Segunda fila: Fecha y Tipo (Gasto/Ingreso) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    📅 Fecha
                  </label>
                  <CustomDatePicker
                    value={formData.date}
                    onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                    placeholder="Seleccionar fecha"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Tipo
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg h-[42px]">
                    <input
                      type="checkbox"
                      id="es_entrada"
                      checked={formData.es_entrada}
                      onChange={(e) => setFormData(prev => ({ ...prev, es_entrada: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="es_entrada" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2 flex-1">
                      <span className="text-lg">{formData.es_entrada ? '💰' : '💸'}</span>
                      <span>{formData.es_entrada ? 'Ingreso' : 'Gasto'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  📝 Descripción
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ej: Almuerzo en restaurante"
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  🏷️ Categoría
                </label>
                {loadingCategories ? (
                  <div className="text-center py-3 text-gray-500">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-xs">Cargando...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Crea categorías en <strong>Configuración</strong>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.category === category.id || formData.category === String(category.id)
                            ? 'border-blue-500 bg-blue-50 shadow-sm scale-105'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl">{category.icon}</span>
                          <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                            {category.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={loading || !formData.amount || !formData.category || !formData.description}
                className="w-full gradient-button text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>💾</span>
                    <span>Guardar {formData.es_entrada ? 'Ingreso' : 'Gasto'}</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Resumen Compacto */}
        <div className="space-y-4">
          {/* Resumen de la transacción */}
          {(formData.category || formData.amount) && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">📋 Resumen</h3>
              <div className="space-y-3">
                {formData.category && (
                  <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{getSelectedCategory()?.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-800">{getSelectedCategory()?.label}</div>
                      <div className="text-xs text-gray-500">Categoría</div>
                    </div>
                  </div>
                )}
                
                {formData.amount && (
                  <div className="p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">Monto {formData.es_entrada ? '(Ingreso)' : '(Gasto)'}</div>
                    <div className="font-bold text-lg text-gray-800">
                      {formData.currency} {parseFloat(formData.amount || 0).toFixed(2)}
                    </div>
                    {formData.currency === 'USD' && (
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ L {calculateConvertedAmount()} LPS
                      </div>
                    )}
                  </div>
                )}

                {formData.description && (
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">Descripción</div>
                    <div className="text-sm font-medium text-gray-800 truncate">{formData.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consejos Compactos */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">💡 Tips</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <span>💡</span>
                <span>Usa descripciones claras</span>
              </div>
              <div className="flex items-start gap-2">
                <span>💰</span>
                <span>USD se convierte automáticamente</span>
              </div>
              <div className="flex items-start gap-2">
                <span>📊</span>
                <span>Categorías ayudan al análisis</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddExpense
