import React, { useState, useEffect, useMemo, useRef } from 'react'
import notifications from '../utils/services/notifications'
import database from '../database/index.js'
import CustomDatePicker from '../components/CustomDatePicker'
import { formatDateLocal, getTodayLocal, parseDateLocal } from '../utils/normalizers'
import settingsManager from '../utils/services/settings'

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
  const [convertedAmount, setConvertedAmount] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [showTips, setShowTips] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const amountRef = useRef(null)
  const dateRef = useRef(null)
  const descriptionRef = useRef(null)
  const categoryRegionRef = useRef(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true)
        const cats = await database.getCategories()
        const mappedCategories = cats.map(cat => ({
          id: cat.id,
          label: cat.name || cat.nombre || '',
          icon: cat.icon || '💰',
          color: cat.color || '#3498db'
        }))
        setCategories(mappedCategories)
      } catch (error) {
        console.error('Error loading categories:', error)
        notifications.showSync('Error al cargar categorías. Reintenta en unos segundos.', 'error')
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors = {}
    const amount = parseFloat(formData.amount)

    if (!formData.amount || Number.isNaN(amount) || amount <= 0) {
      errors.amount = 'Ingresa un monto mayor a 0.'
    }
    if (!formData.date) {
      errors.date = 'Selecciona una fecha.'
    }
    if (!formData.category) {
      errors.category = 'Selecciona una categoría.'
    }
    if (!formData.description || formData.description.trim().length < 3) {
      errors.description = 'La descripción debe tener al menos 3 caracteres.'
    }
    return errors
  }

  const focusFirstError = (errors) => {
    if (errors.amount && amountRef.current) return amountRef.current.focus()
    if (errors.date && dateRef.current) return dateRef.current.focus()
    if (errors.category && categoryRegionRef.current) return categoryRegionRef.current.focus()
    if (errors.description && descriptionRef.current) return descriptionRef.current.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const errors = validateForm()
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        notifications.showSync('Revisa los campos marcados en el formulario.', 'error')
        focusFirstError(errors)
        setLoading(false)
        return
      }

      let finalAmount = parseFloat(formData.amount)
      let exchangeRateUsed = null

      if (formData.currency === 'USD') {
        const exchangeApiService = await import('../utils/services/exchangeApi.js')
        const rate = await exchangeApiService.default.getExchangeRate()
        exchangeRateUsed = rate
        finalAmount = finalAmount * rate
      }

      const selectedCategory = categories.find(cat => cat.id === formData.category || cat.id === parseInt(formData.category))
      if (!selectedCategory) {
        const categoryError = { category: 'Selecciona una categoría válida.' }
        setFieldErrors(prev => ({ ...prev, ...categoryError }))
        notifications.showSync('Por favor, selecciona una categoría válida.', 'error')
        focusFirstError(categoryError)
        setLoading(false)
        return
      }

      const expenseData = {
        fecha: formData.date,
        monto: finalAmount,
        categoria_id: selectedCategory.id,
        descripcion: formData.description.trim(),
        es_entrada: formData.es_entrada,
        moneda_original: formData.currency,
        tasa_cambio_usada: exchangeRateUsed
      }

      const allExpenses = await database.getExpenses()

      let yearScope = settingsManager.get('expenseBreakdownYearScope', 'current')
      if (!yearScope || yearScope === 'current') {
        try {
          const dbConfig = await database.getConfig('alcance_desglose_gasto')
          if (dbConfig) {
            yearScope = dbConfig
            settingsManager.set('expenseBreakdownYearScope', dbConfig)
          }
        } catch (error) {
          console.warn('No se pudo cargar configuración desde la base de datos:', error)
        }
      }
      const currentYear = new Date().getFullYear()

      let filteredExpenses = allExpenses
      if (yearScope === 'current') {
        filteredExpenses = allExpenses.filter(expense => {
          if (!expense.fecha) return false
          const expenseDate = parseDateLocal(expense.fecha)
          if (!expenseDate) return false
          return expenseDate.getFullYear() === currentYear
        })
      }

      const gastos = filteredExpenses.filter(expense => !expense.es_entrada)
      const ingresos = filteredExpenses.filter(expense => expense.es_entrada)
      const totalGastosActual = gastos.reduce((sum, expense) => sum + expense.monto, 0)
      const totalIngresosActual = ingresos.reduce((sum, expense) => sum + expense.monto, 0)
      const totalNetoActual = totalIngresosActual - totalGastosActual

      const createResult = await database.createExpense(expenseData)

      if (onExpenseAdded) {
        onExpenseAdded({ scope: 'expenses', source: 'add-expense' })
      }

      let nuevoTotalGastos = totalGastosActual
      let nuevoTotalIngresos = totalIngresosActual

      if (expenseData.es_entrada) {
        nuevoTotalIngresos += finalAmount
      } else {
        nuevoTotalGastos += finalAmount
      }

      const nuevoTotalNeto = nuevoTotalIngresos - nuevoTotalGastos

      setFormData({
        amount: '',
        currency: 'LPS',
        category: '',
        description: '',
        date: formData.date,
        es_entrada: false
      })
      setFieldErrors({})
      setCategoryQuery('')

      const categoryName = selectedCategory?.label || formData.category
      if (createResult?.queued) {
        notifications.showSync('Sin conexión: el movimiento quedó pendiente de sincronización.', 'warning', 4500)
      } else {
        notifications.showExpenseProgress(
        {
          amount: finalAmount,
          category: categoryName,
          description: formData.description,
          es_entrada: expenseData.es_entrada
        },
        {
          totalGastosAnterior: totalGastosActual,
          totalIngresosAnterior: totalIngresosActual,
          totalNetoAnterior: totalNetoActual,
          totalGastosNuevo: nuevoTotalGastos,
          totalIngresosNuevo: nuevoTotalIngresos,
          totalNetoNuevo: nuevoTotalNeto
        }
      )
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      notifications.showSync('Error al guardar el gasto', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.category || cat.id === parseInt(formData.category))
  }

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((cat) => `${cat.label}`.toLowerCase().includes(q))
  }, [categories, categoryQuery])

  useEffect(() => {
    const updateConvertedAmount = async () => {
      if (!formData.amount || formData.currency === 'LPS') {
        setConvertedAmount('')
        return
      }

      try {
        const exchangeApiService = await import('../utils/services/exchangeApi.js')
        const exchangeRate = await exchangeApiService.default.getExchangeRate()
        setConvertedAmount((parseFloat(formData.amount) * exchangeRate).toFixed(2))
      } catch (error) {
        const exchangeRate = 26.18
        setConvertedAmount((parseFloat(formData.amount) * exchangeRate).toFixed(2))
      }
    }

    updateConvertedAmount()
  }, [formData.amount, formData.currency])

  return (
    <div className='max-w-6xl mx-auto space-y-4 animate-fade-in'>
      <div className='glass-card rounded-xl p-4'>
        <h2 className='text-2xl font-bold text-zinc-100'>Agregar movimiento</h2>
        <p className='text-sm text-zinc-400 mt-1'>Registra gastos o ingresos en pocos pasos.</p>
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <div className='glass-card rounded-xl p-5'>
            <form onSubmit={handleSubmit} noValidate className='space-y-5'>
              <fieldset className='space-y-2'>
                <legend className='mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500'>Tipo de movimiento</legend>
                <div className='grid grid-cols-2 gap-2' role='radiogroup' aria-label='Tipo de movimiento'>
                  <button
                    type='button'
                    role='radio'
                    aria-checked={!formData.es_entrada}
                    onClick={() => setFormData(prev => ({ ...prev, es_entrada: false }))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      !formData.es_entrada
                        ? 'border-rose-400/60 bg-rose-500/10 text-rose-300'
                        : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    Gasto
                  </button>
                  <button
                    type='button'
                    role='radio'
                    aria-checked={formData.es_entrada}
                    onClick={() => setFormData(prev => ({ ...prev, es_entrada: true }))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      formData.es_entrada
                        ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300'
                        : 'border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    Ingreso
                  </button>
                </div>
              </fieldset>

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                <div className='sm:col-span-2'>
                  <label className='mb-1.5 block text-xs font-medium text-zinc-400' htmlFor='amount'>
                    Monto
                  </label>
                  <input
                    id='amount'
                    ref={amountRef}
                    type='number'
                    name='amount'
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    placeholder='0.00'
                    step='0.01'
                    min='0.01'
                    required
                    aria-invalid={Boolean(fieldErrors.amount)}
                    aria-describedby={fieldErrors.amount ? 'amount-error' : undefined}
                    className={`w-full rounded-lg border px-3 py-2.5 text-lg font-semibold transition-all bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      fieldErrors.amount ? 'border-rose-500' : 'border-zinc-600'
                    }`}
                  />
                  {fieldErrors.amount && (
                    <p id='amount-error' className='mt-1 text-xs text-rose-400'>{fieldErrors.amount}</p>
                  )}
                </div>

                <div>
                  <label className='mb-1.5 block text-xs font-medium text-zinc-400' htmlFor='currency'>
                    Moneda
                  </label>
                  <select
                    id='currency'
                    name='currency'
                    value={formData.currency}
                    onChange={handleInputChange}
                    className='w-full rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2.5 text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
                  >
                    <option value='LPS'>LPS</option>
                    <option value='USD'>USD</option>
                  </select>
                </div>
              </div>

              {formData.currency === 'USD' && formData.amount && convertedAmount && (
                <div className='rounded-lg border border-blue-800/80 bg-blue-900/20 p-2.5'>
                  <div className='flex items-center gap-2 text-sm text-blue-300'>
                    <span className='font-medium'>${formData.amount} USD = L {convertedAmount} LPS</span>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <div>
                  <label className='mb-1.5 block text-xs font-medium text-zinc-400' htmlFor='expense-date-trigger'>
                    Fecha
                  </label>
                  <CustomDatePicker
                    id='expense-date'
                    buttonId='expense-date-trigger'
                    buttonRef={dateRef}
                    value={formData.date}
                    onChange={(date) => {
                      setFormData(prev => ({ ...prev, date }))
                      setFieldErrors(prev => ({ ...prev, date: '' }))
                    }}
                    placeholder='Seleccionar fecha'
                    className='w-full'
                    aria-invalid={Boolean(fieldErrors.date)}
                    aria-describedby={fieldErrors.date ? 'date-error' : undefined}
                  />
                  {fieldErrors.date && <p id='date-error' className='mt-1 text-xs text-rose-400'>{fieldErrors.date}</p>}
                </div>
                <div>
                  <label className='mb-1.5 block text-xs font-medium text-zinc-400'>Resumen rápido</label>
                  <div className='flex h-[42px] items-center rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 text-sm text-zinc-300'>
                    {formData.es_entrada ? 'Se registrará como ingreso' : 'Se registrará como gasto'}
                  </div>
                </div>
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-medium text-zinc-400' htmlFor='description'>
                  Descripción
                </label>
                <input
                  id='description'
                  ref={descriptionRef}
                  type='text'
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder='Ej: Almuerzo en restaurante'
                  required
                  aria-invalid={Boolean(fieldErrors.description)}
                  aria-describedby={fieldErrors.description ? 'description-error' : undefined}
                  className={`w-full rounded-lg border px-3 py-2.5 bg-zinc-900 text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    fieldErrors.description ? 'border-rose-500' : 'border-zinc-600'
                  }`}
                />
                {fieldErrors.description && <p id='description-error' className='mt-1 text-xs text-rose-400'>{fieldErrors.description}</p>}
              </div>

              <div>
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <label className='block text-xs font-medium text-zinc-400'>Categoría</label>
                  <input
                    type='text'
                    value={categoryQuery}
                    onChange={(e) => setCategoryQuery(e.target.value)}
                    placeholder='Buscar...'
                    className='w-32 rounded-md border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
                <div
                  ref={categoryRegionRef}
                  tabIndex={-1}
                  aria-invalid={Boolean(fieldErrors.category)}
                  aria-describedby={fieldErrors.category ? 'category-error' : undefined}
                >
                  {loadingCategories ? (
                    <div className='py-3 text-center text-zinc-400'>
                      <div className='mx-auto h-5 w-5 animate-spin rounded-full border-b-2 border-blue-500'></div>
                      <p className='mt-2 text-xs'>Cargando categorías...</p>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className='rounded-lg border border-yellow-800 bg-yellow-900/20 p-3'>
                      <p className='text-xs text-yellow-300'>
                        No hay categorías. Ve a <strong>Configuración</strong> para crear una.
                      </p>
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <div className='rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 text-xs text-zinc-400'>
                      No hay resultados para "{categoryQuery}".
                    </div>
                  ) : (
                    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
                      {filteredCategories.map((category) => (
                        <button
                          key={category.id}
                          type='button'
                          aria-pressed={formData.category === category.id || formData.category === String(category.id)}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: category.id }))
                            setFieldErrors(prev => ({ ...prev, category: '' }))
                          }}
                          className={`rounded-lg border-2 p-3 transition-all ${
                            formData.category === category.id || formData.category === String(category.id)
                              ? 'border-blue-500 bg-blue-900/30 shadow-sm scale-105'
                              : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                          }`}
                        >
                          <div className='flex flex-col items-center gap-1'>
                            <span className='text-xl'>{category.icon}</span>
                            <span className='text-xs font-medium text-zinc-300 text-center leading-tight'>{category.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {fieldErrors.category && <p id='category-error' className='mt-1 text-xs text-rose-400'>{fieldErrors.category}</p>}
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full gradient-button text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]'
              >
                {loading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  <span className='flex items-center justify-center gap-2'>
                    <span>Guardar {formData.es_entrada ? 'Ingreso' : 'Gasto'}</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className='space-y-4'>
          {(formData.category || formData.amount || formData.description) && (
            <div className='glass-card rounded-xl p-4'>
              <h3 className='text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wide'>Resumen</h3>
              <div className='space-y-3'>
                {formData.category && (
                  <div className='flex items-center gap-3 p-2.5 bg-zinc-800/50 rounded-lg'>
                    <span className='text-2xl'>{getSelectedCategory()?.icon}</span>
                    <div className='flex-1'>
                      <div className='font-semibold text-sm text-zinc-200'>{getSelectedCategory()?.label}</div>
                      <div className='text-xs text-zinc-400'>Categoría</div>
                    </div>
                  </div>
                )}

                {formData.amount && (
                  <div className='p-2.5 bg-blue-900/20 rounded-lg border border-blue-800/80'>
                    <div className='text-xs text-zinc-400 mb-1'>Monto {formData.es_entrada ? '(Ingreso)' : '(Gasto)'}</div>
                    <div className='font-bold text-lg text-zinc-100'>
                      {formData.currency} {parseFloat(formData.amount || 0).toFixed(2)}
                    </div>
                    {formData.currency === 'USD' && convertedAmount && (
                      <div className='text-xs text-zinc-400 mt-1'>≈ L {convertedAmount} LPS</div>
                    )}
                  </div>
                )}

                {formData.description && (
                  <div className='p-2.5 bg-zinc-800/50 rounded-lg'>
                    <div className='text-xs text-zinc-400 mb-1'>Descripción</div>
                    <div className='text-sm font-medium text-zinc-200 truncate'>{formData.description}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className='glass-card rounded-xl p-4'>
            <button
              type='button'
              onClick={() => setShowTips((prev) => !prev)}
              className='w-full flex items-center justify-between text-left'
              aria-expanded={showTips}
            >
              <h3 className='text-xs font-semibold text-zinc-400 uppercase tracking-wide'>Ayudas rápidas</h3>
              <span className='text-zinc-500'>{showTips ? '−' : '+'}</span>
            </button>
            {showTips && (
              <div className='mt-3 space-y-2 text-xs text-zinc-400'>
                <div>Usa descripciones claras para encontrar movimientos rápido.</div>
                <div>Si usas USD, la conversión a LPS se calcula automáticamente.</div>
                <div>La categoría correcta mejora tus reportes y presupuestos.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='sr-only' aria-live='assertive'>
        {Object.values(fieldErrors).filter(Boolean)[0] || ''}
      </div>
    </div>
  )
}

export default AddExpense
