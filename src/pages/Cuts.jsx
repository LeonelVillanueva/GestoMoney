import React, { useState, useEffect } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'
import CustomDatePicker from '../components/CustomDatePicker'
import { formatDateLocal, getTodayLocal, parseDateLocal, compareDates, normalizeMany, normalizeCut } from '../utils/normalizers'

const Cuts = ({ onDataAdded }) => {
  const [formData, setFormData] = useState({
    fecha: formatDateLocal(getTodayLocal()),
    monto: 0, // Valor fijo ya que solo importa fecha y tipo
    tipo_corte: '',
    descripcion: 'Corte registrado'
  })
  const [loading, setLoading] = useState(false)
  const [cuts, setCuts] = useState([])
  const [cutTypes, setCutTypes] = useState([])

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
    try {
      const data = await database.getCuts()
      // Normalizar los cortes para asegurar consistencia en los datos
      const normalizedCuts = normalizeMany(data, normalizeCut)
      setCuts(normalizedCuts)
    } catch (error) {
      console.error('Error loading cuts:', error)
      notifications.showSync('Error al cargar cortes', 'error')
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

      await database.createCut(cutData)
      
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
        onDataAdded()
      }

      notifications.showSync('✅ Corte registrado exitosamente', 'success')
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

  // Calcular estadísticas
  const ultimoCorte = cuts.length > 0 ? cuts.sort((a, b) => {
    const dateA = parseDateLocal(a.fecha)
    const dateB = parseDateLocal(b.fecha)
    if (!dateA || !dateB) return 0
    const comparison = compareDates(dateB, dateA)
    return comparison !== null ? comparison : 0
  })[0] : null

  const cortesPorTipo = cutTypes.map(tipo => {
    // Normalizar el tipo para comparación (ya está normalizado con trim en normalizeCut)
    const tipoNormalizado = tipo.trim()
    const cortesDelTipo = cuts.filter(c => {
      // Los cortes ya están normalizados con trim, pero por seguridad lo hacemos de nuevo
      const corteTipo = (c.tipo_corte || '').trim()
      return corteTipo === tipoNormalizado
    })
    return {
      tipo,
      cantidad: cortesDelTipo.length
    }
  })

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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">💇 Gestión de Cortes</h2>
      </div>

      {/* Estadísticas Rápidas Compactas */}
      {cuts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Cortes</p>
                <p className="text-lg font-bold text-purple-700">{cuts.length}</p>
              </div>
              <span className="text-2xl">💇</span>
            </div>
          </div>
          
          {ultimoCorte && (
            <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Último Corte</p>
                  <p className="text-lg font-bold text-blue-700">{formatDate(ultimoCorte.fecha)}</p>
                </div>
                <span className="text-2xl">{getCutIcon(ultimoCorte.tipo_corte)}</span>
              </div>
            </div>
          )}

          {daysSinceLastCut !== null && (
            <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Días desde último</p>
                  <p className="text-lg font-bold text-green-700">{daysSinceLastCut} días</p>
                </div>
                <span className="text-2xl">📅</span>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-3 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Tipos Configurados</p>
                <p className="text-lg font-bold text-orange-700">{cutTypes.length}</p>
              </div>
              <span className="text-2xl">✂️</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formulario de Corte Compacto */}
        <div className="lg:col-span-1 glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">➕ Nuevo Corte</h3>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                💇 Tipo de Corte
              </label>
              <select
                name="tipo_corte"
                value={formData.tipo_corte}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">📋 Cortes Recientes</h3>
            {cuts.length > 0 && (
              <span className="text-xs text-gray-500">{cuts.length} cortes</span>
            )}
          </div>
          
          {cuts.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cuts.slice(0, 10).map((cut) => (
                <div key={cut.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-1.5 bg-white rounded-lg flex-shrink-0">
                      <span className="text-lg">{getCutIcon(cut.tipo_corte)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 truncate">{cut.tipo_corte}</h4>
                      <p className="text-xs text-gray-600">{formatDate(cut.fecha)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {cuts.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">Y {cuts.length - 10} cortes más...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">💇</div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">No hay cortes registrados</h3>
              <p className="text-xs text-gray-500">Registra tu primer corte usando el formulario</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas por Tipo de Corte */}
      {cuts.length > 0 && cortesPorTipo.some(c => c.cantidad > 0) && (
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">📊 Por Tipo de Corte</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cortesPorTipo.map((item, index) => {
              if (item.cantidad === 0) return null
              const colors = [
                'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
                'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
                'from-green-50 to-green-100 border-green-200 text-green-700',
                'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
                'from-pink-50 to-pink-100 border-pink-200 text-pink-700'
              ]
              const colorClass = colors[index % colors.length]
              
              return (
                <div key={index} className={`bg-gradient-to-br ${colorClass} rounded-lg p-3 border`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{getCutIcon(item.tipo)}</span>
                    <span className="text-xs font-medium">{item.cantidad} cortes</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{item.tipo}</p>
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
