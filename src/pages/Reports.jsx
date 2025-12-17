import React, { useState, useEffect } from 'react'
import pdfGenerator from '../utils/generators/pdfGenerator'
import templateEngine from '../utils/generators/templateEngine'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'
import TemplateManager from '../components/TemplateManager'

const Reports = ({ expenses, onDataChanged }) => {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState('monthly')
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [activeTab, setActiveTab] = useState('standard') // 'standard' or 'templates'

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7)
      const budgetsData = await database.getBudgets(currentMonth)
      setBudgets(budgetsData)
    } catch (error) {
      console.error('Error loading budgets:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      let filename = ''
      let data = {}

      switch (reportType) {
        case 'monthly':
          data = { expenses, budgets, month: selectedMonth }
          filename = `reporte-mensual-${selectedMonth}.pdf`
          break
          
        case 'category':
          data = { expenses, budgets }
          filename = 'reporte-por-categoria.pdf'
          break
          
        case 'budget':
          data = { budgets, expenses }
          filename = 'reporte-presupuestos.pdf'
          break
          
        case 'period':
          if (!customDateRange.startDate || !customDateRange.endDate) {
            notifications.showSync('Por favor selecciona ambas fechas', 'error')
            return
          }
          data = { 
            expenses, 
            startDate: customDateRange.startDate, 
            endDate: customDateRange.endDate 
          }
          filename = `reporte-${customDateRange.startDate}-${customDateRange.endDate}.pdf`
          break
          
        default:
          notifications.showSync('Tipo de reporte no válido', 'error')
          return
      }

      const success = pdfGenerator.generateAndDownload(reportType, data, filename)
      
      if (success) {
        notifications.showSync('✅ Reporte generado exitosamente', 'success')
      } else {
        notifications.showSync('❌ Error al generar el reporte', 'error')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      notifications.showSync('❌ Error al generar el reporte: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateReportWithTemplate = async (template) => {
    setLoading(true)
    try {
      let data = {}
      
      // Preparar datos según el tipo de plantilla
      switch (template.category) {
        case 'monthly':
          data = { expenses, budgets, month: selectedMonth }
          break
        case 'expenses':
          data = { expenses, period: 'Período actual' }
          break
        case 'budget':
          data = { budgets, expenses, month: selectedMonth }
          break
        default:
          data = { expenses, budgets, month: selectedMonth }
      }

      const doc = templateEngine.generatePDFFromTemplate(template.id, data)
      const filename = `${template.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`
      
      doc.save(filename)
      notifications.showSync('✅ Reporte generado con plantilla exitosamente', 'success')
    } catch (error) {
      console.error('Error generating template report:', error)
      notifications.showSync('❌ Error al generar reporte con plantilla: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    generateReportWithTemplate(template)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-HN')
  }

  const getReportDescription = (type) => {
    const descriptions = {
      monthly: 'Reporte completo del mes seleccionado con resumen de gastos, presupuestos y análisis por categoría',
      category: 'Análisis detallado de gastos agrupados por categoría con comparación de presupuestos',
      budget: 'Estado actual de todos los presupuestos con seguimiento de gastos y alertas',
      period: 'Reporte personalizado para un rango de fechas específico con todos los gastos detallados'
    }
    return descriptions[type] || ''
  }

  const getReportIcon = (type) => {
    const icons = {
      monthly: '📅',
      category: '📊',
      budget: '💰',
      period: '📈'
    }
    return icons[type] || '📄'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">📄 Reportes</h2>
        <p className="text-gray-600">Genera reportes detallados en PDF de tus gastos y presupuestos</p>
      </div>

      {/* Pestañas */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'standard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 Reportes Estándar
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎨 Plantillas Personalizadas
          </button>
        </div>

        {activeTab === 'standard' && (
          <>
            {/* Tipo de Reporte */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Selecciona el Tipo de Reporte</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'monthly', name: 'Reporte Mensual', icon: '📅' },
                  { id: 'category', name: 'Por Categoría', icon: '📊' },
                  { id: 'budget', name: 'Presupuestos', icon: '💰' },
                  { id: 'period', name: 'Período Personalizado', icon: '📈' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setReportType(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      reportType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">{type.name}</div>
                        <div className="text-sm text-gray-600">{getReportDescription(type.id)}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuración del Reporte */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configuración del Reporte</h3>
              
              {reportType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona el Mes
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {reportType === 'period' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Final
                    </label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Botones de Generación */}
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="gradient-button text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>📄</span>
                      <span>Generar Reporte PDF</span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    try {
                      const testResult = pdfGenerator.testGenerator()
                      if (testResult) {
                        notifications.showSync('✅ Generador de PDF funciona correctamente', 'success')
                      } else {
                        notifications.showSync('❌ Error en el generador de PDF', 'error')
                      }
                    } catch (error) {
                      notifications.showSync('❌ Error en el generador: ' + error.message, 'error')
                    }
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  🧪 Probar Generador
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'templates' && (
          <TemplateManager onTemplateSelect={handleTemplateSelect} />
        )}
      </div>

      {/* Vista Previa de Datos */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Vista Previa de Datos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(expenses.reduce((sum, expense) => sum + expense.monto, 0))}
            </div>
            <div className="text-sm text-gray-600">Total de Gastos</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-bold text-green-600">{expenses.length}</div>
            <div className="text-sm text-gray-600">Transacciones</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-purple-600">{budgets.length}</div>
            <div className="text-sm text-gray-600">Presupuestos</div>
          </div>
        </div>
      </div>

      {/* Información sobre Reportes */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">ℹ️ Información sobre los Reportes</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 mt-1">📅</span>
            <div>
              <strong>Reporte Mensual:</strong> Incluye resumen general, gastos por categoría, estado de presupuestos y análisis detallado del mes seleccionado.
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-green-500 mt-1">📊</span>
            <div>
              <strong>Por Categoría:</strong> Análisis detallado de gastos agrupados por categoría con comparación de presupuestos y porcentajes de uso.
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-yellow-500 mt-1">💰</span>
            <div>
              <strong>Presupuestos:</strong> Estado actual de todos los presupuestos con seguimiento de gastos, alertas y análisis de cumplimiento.
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-purple-500 mt-1">📈</span>
            <div>
              <strong>Período Personalizado:</strong> Reporte detallado para un rango de fechas específico con todos los gastos listados cronológicamente.
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <span className="text-pink-500 mt-1">🎨</span>
            <div>
              <strong>Plantillas Personalizadas:</strong> Crea y personaliza tus propios reportes con secciones, estilos y configuraciones únicas.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
