import React, { useState, useEffect, useMemo } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'
import CustomDatePicker from '../components/CustomDatePicker'
import AsyncStatePanel from '../components/AsyncStatePanel'
import { formatDateLocal, getTodayLocal, parseDateLocal, compareDates, normalizeMany, normalizeCut } from '../utils/normalizers'
import { useYearFilter } from '../hooks/useYearFilter'
import YearSelector from '../components/YearSelector'

const Cuts = ({ onDataAdded }) => {
  const [formData, setFormData] = useState({
    fecha: formatDateLocal(getTodayLocal()),
    monto: 0, // Valor fijo ya que solo importa fecha y tipo
    tipo_corte: '',
    descripcion: 'Corte registrado'
  })
  const [loading, setLoading] = useState(false)
  const [loadingCuts, setLoadingCuts] = useState(false)
  const [cutsError, setCutsError] = useState('')
  const [cuts, setCuts] = useState([])
  const [cutTypes, setCutTypes] = useState([])

  // Hook para filtro de año
  const {
    yearFilter,
    selectedYear,
    currentYear,
    availableYears,
    previousYears,
    filterLabel,
    filteredData: cutsByYear,
    statsByYear,
    handleYearFilterChange
  } = useYearFilter(cuts)

  useEffect(() => {
    loadCuts()
    loadCutTypes()
  }, [])

  const loadCutTypes = async () => {
    try {
      const config = await database.getAllConfig()
      const types = JSON.parse(config.tipos_corte_por_defecto || '["Corte Barba", "Corte Pelo", "Corte Priv"]')
      setCutTypes(types)
    } catch (error) {
      console.error('Error loading cut types:', error)
      // Fallback a tipos por defecto
      setCutTypes(['Corte Barba', 'Corte Pelo', 'Corte Priv'])
    }
  }

  const loadCuts = async () => {
    setLoadingCuts(true)
    setCutsError('')
    try {
      const data = await database.getCuts()
      // Normalizar los cortes para asegurar consistencia en los datos
      const normalizedCuts = normalizeMany(data, normalizeCut)
      setCuts(normalizedCuts)
    } catch (error) {
      console.error('Error loading cuts:', error)
      setCutsError('No se pudieron cargar los cortes.')
      notifications.showSync('Error al cargar cortes', 'error')
    } finally {
      setLoadingCuts(false)
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
      if (!formData.tipo_corte) {
        notifications.showSync('Por favor, selecciona un tipo de corte.', 'error')
        return
      }

      const cutData = {
        fecha: formData.fecha,
        monto: 0, // No importa el monto, solo fecha y tipo
        tipo_corte: formData.tipo_corte,
        descripcion: `Corte: ${formData.tipo_corte}`
      }

      const createResult = await database.createCut(cutData)
      
      // Limpiar formulario
      setFormData({
        fecha: formatDateLocal(getTodayLocal()),
        monto: 0,
        tipo_corte: '',
        descripcion: 'Corte registrado'
      })

      // Recargar cortes
      await loadCuts()

      // Notificar que se agregó
      if (onDataAdded) {
        onDataAdded({ scope: 'expenses', source: 'cuts' })
      }

      if (createResult?.queued) {
        notifications.showSync('Sin conexión: el corte quedó pendiente de sincronización.', 'warning')
      } else {
        notifications.showSync('✅ Corte registrado exitosamente', 'success')
      }
    } catch (error) {
      console.error('Error saving cut:', error)
      notifications.showSync('❌ Error al guardar el corte', 'error')
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

  // Función para obtener la fecha del último corte
  const getLastCutDate = () => {
    if (!cuts || cuts.length === 0) return 'N/A'
    
    try {
      // Ordenar cortes por fecha (más reciente primero)
      const sortedCuts = [...cuts].sort((a, b) => {
        const dateA = parseDateLocal(a.fecha)
        const dateB = parseDateLocal(b.fecha)
        if (!dateA || !dateB) return 0
        const comparison = compareDates(dateB, dateA)
        return comparison !== null ? comparison : 0
      })
      
      return formatDate(sortedCuts[0].fecha)
    } catch (error) {
      return 'Error'
    }
  }

  const getCutIcon = (tipo) => {
    const icons = {
      'Corte Barba': '🧔',
      'Corte Pelo': '💇',
      'Corte Priv': '💇‍♂️'
    }
    return icons[tipo] || '💇'
  }

  // Calcular estadísticas (usando datos filtrados por año)
  const ultimoCorte = useMemo(() => {
    if (cutsByYear.length === 0) return null
    return cutsByYear.sort((a, b) => {
      const dateA = parseDateLocal(a.fecha)
      const dateB = parseDateLocal(b.fecha)
      if (!dateA || !dateB) return 0
      const comparison = compareDates(dateB, dateA)
      return comparison !== null ? comparison : 0
    })[0]
  }, [cutsByYear])

  const cortesPorTipo = useMemo(() => {
    return cutTypes.map(tipo => {
      // Normalizar el tipo para comparación (ya está normalizado con trim en normalizeCut)
      const tipoNormalizado = tipo.trim()
      const cortesDelTipo = cutsByYear.filter(c => {
        // Los cortes ya están normalizados con trim, pero por seguridad lo hacemos de nuevo
        const corteTipo = (c.tipo_corte || '').trim()
        return corteTipo === tipoNormalizado
      })
      return {
        tipo,
        cantidad: cortesDelTipo.length
      }
    })
  }, [cutsByYear, cutTypes])

  // Calcular días desde el último corte
  const getDaysSinceLastCut = () => {
    if (!ultimoCorte) return null
    try {
      const lastCutDate = parseDateLocal(ultimoCorte.fecha)
      if (!lastCutDate) return null
      const today = getTodayLocal()
      const diffTime = today - lastCutDate
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    } catch (error) {
      return null
    }
  }

  const daysSinceLastCut = getDaysSinceLastCut()

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 dark:text-slate-100">💇 Gestión de Cortes</h2>
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
      {cutsByYear.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="stat-card rounded-xl p-3 border-l-4 border-l-violet-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 mb-1">
                  Total cortes {yearFilter !== 'all' && <span className="text-violet-400/80">({filterLabel})</span>}
                </p>
                <p className="text-lg font-bold text-zinc-100">{cutsByYear.length}</p>
              </div>
              <span className="text-2xl opacity-80" aria-hidden>💇</span>
            </div>
          </div>
          
          {ultimoCorte && (
            <div className="stat-card rounded-xl p-3 border-l-4 border-l-sky-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Último corte</p>
                  <p className="text-lg font-bold text-zinc-100">{formatDate(ultimoCorte.fecha)}</p>
                </div>
                <span className="text-2xl">{getCutIcon(ultimoCorte.tipo_corte)}</span>
              </div>
            </div>
          )}

          {daysSinceLastCut !== null && (
            <div className="stat-card rounded-xl p-3 border-l-4 border-l-emerald-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Días desde el último</p>
                  <p className="text-lg font-bold text-zinc-100">{daysSinceLastCut} días</p>
                </div>
                <span className="text-2xl opacity-80" aria-hidden>📅</span>
              </div>
            </div>
          )}

          <div className="stat-card rounded-xl p-3 border-l-4 border-l-orange-500/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Tipos configurados</p>
                <p className="text-lg font-bold text-zinc-100">{cutTypes.length}</p>
              </div>
              <span className="text-2xl opacity-80" aria-hidden>✂️</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario de Corte Compacto */}
        <div className="lg:col-span-1 glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 dark:text-slate-100 mb-4">➕ Nuevo Corte</h3>
          
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

            {/* Tipo de Corte */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                💇 Tipo de Corte
              </label>
              <select
                name="tipo_corte"
                value={formData.tipo_corte}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Selecciona tipo</option>
                {cutTypes.map(type => (
                  <option key={type} value={type}>
                    {getCutIcon(type)} {type}
                  </option>
                ))}
              </select>
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
                  <span>💇</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Cortes Recientes Compacta */}
        <div className="lg:col-span-2 glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-zinc-100 dark:text-slate-100">📋 Cortes Recientes</h3>
            {cutsByYear.length > 0 && (
              <span className="text-xs text-gray-500">{cutsByYear.length} cortes</span>
            )}
          </div>
          
          {loadingCuts ? (
            <AsyncStatePanel
              kind="loading"
              title="Cargando cortes"
              message="Obteniendo tu historial de cortes..."
            />
          ) : cutsError ? (
            <AsyncStatePanel
              kind="error"
              title="Error al cargar cortes"
              message={cutsError}
              actionLabel="Reintentar"
              onAction={loadCuts}
            />
          ) : cutsByYear.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cutsByYear.slice(0, 10).map((cut) => (
                <div key={cut.id} className="flex items-center justify-between p-3 bg-zinc-800/50 dark:bg-slate-700/50 rounded-lg hover:bg-zinc-800/60 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-1.5 bg-zinc-900 rounded-lg flex-shrink-0">
                      <span className="text-lg">{getCutIcon(cut.tipo_corte)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-zinc-100 truncate">{cut.tipo_corte}</h4>
                      <p className="text-xs text-zinc-400">{formatDate(cut.fecha)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {cutsByYear.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">Y {cutsByYear.length - 10} cortes más...</p>
                </div>
              )}
            </div>
          ) : (
            <AsyncStatePanel
              kind="empty"
              title="No hay cortes registrados"
              message="Registra tu primer corte usando el formulario."
            />
          )}
        </div>
      </div>

      {/* Estadísticas por Tipo de Corte */}
      {cuts.length > 0 && cortesPorTipo.some(c => c.cantidad > 0) && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-zinc-100 dark:text-slate-100 mb-3">📊 Por Tipo de Corte</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cortesPorTipo.map((item, index) => {
              if (item.cantidad === 0) return null
              const accent = [
                'border-l-violet-500/50',
                'border-l-sky-500/50',
                'border-l-emerald-500/50',
                'border-l-orange-500/50',
                'border-l-rose-500/50'
              ]
              return (
                <div key={index} className={`stat-card rounded-lg p-3 border-l-4 ${accent[index % accent.length]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{getCutIcon(item.tipo)}</span>
                    <span className="text-xs font-medium text-zinc-400">{item.cantidad} cortes</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-1">{item.tipo}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Cuts
