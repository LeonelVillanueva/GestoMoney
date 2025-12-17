import React, { useState, useEffect } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'
import DateInput from '../components/DateInput'
import { formatDateLocal, getTodayLocal, parseDateLocal, compareDates } from '../utils/normalizers'

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
      setCuts(data)
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">💇 Gestión de Cortes</h2>
        <p className="text-gray-600">Registra tus visitas al barbero o peluquería</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Corte */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">➕ Nuevo Corte</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha */}
            <DateInput
              label="📅 Fecha del Corte"
              value={formData.fecha}
              onChange={(fecha) => setFormData(prev => ({ ...prev, fecha }))}
              required
            />

            {/* Tipo de Corte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💇 Tipo de Corte
              </label>
              <select
                name="tipo_corte"
                value={formData.tipo_corte}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Selecciona un tipo de corte</option>
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
              className="gradient-button text-white w-full py-3 rounded-lg text-lg font-semibold flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Registrar Corte</span>
                  <span>💇</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Lista de Cortes Recientes */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">📋 Cortes Recientes</h3>
          
          {cuts.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cuts.map((cut) => (
                <div key={cut.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-lg">
                      <span className="text-xl">{getCutIcon(cut.tipo_corte)}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{cut.tipo_corte}</h4>
                      <p className="text-sm text-gray-600">Corte registrado</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatDate(cut.fecha)}</p>
                    <p className="text-sm text-gray-600">Fecha del corte</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💇</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No hay cortes registrados</h3>
              <p className="text-gray-500">Comienza registrando tu primer corte</p>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Estadísticas de Cortes</h3>
        
        {cuts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💇</div>
              <h4 className="text-lg font-bold text-gray-800">Total Cortes</h4>
              <p className="text-2xl font-bold text-purple-600">{cuts.length}</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <h4 className="text-lg font-bold text-gray-800">Último Corte</h4>
              <p className="text-2xl font-bold text-blue-600">
                {getLastCutDate()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500">Las estadísticas aparecerán cuando registres cortes</p>
          </div>
        )}
      </div>

    </div>
  )
}

export default Cuts
