import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import templateEngine from '../utils/generators/templateEngine'
import notifications from '../utils/services/notifications'
import DeleteConfirmModal from './DeleteConfirmModal'
import logger from '../utils/logger'

const TemplateManager = ({ onTemplateSelect, onClose }) => {
  const [templates, setTemplates] = useState([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  
  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    templateId: null,
    templateName: ''
  })
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'monthly',
    config: {
      title: 'Reporte Personalizado - {{month}}',
      showSummary: true,
      showCategoryBreakdown: true,
      showBudgetComparison: true,
      showCharts: false,
      customFields: []
    },
    layout: {
      header: {
        title: 'Reporte Personalizado - {{month}}',
        subtitle: 'Generado el {{date}}',
        logo: null
      },
      sections: [
        {
          type: 'summary',
          title: 'Resumen General',
          position: 'top'
        }
      ]
    }
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    logger.log('🔍 Cargando plantillas...')
    const allTemplates = templateEngine.getTemplates()
    logger.log('📋 Plantillas cargadas:', allTemplates)
    setTemplates(allTemplates)
  }

  const handleCreateTemplate = () => {
    logger.log('✏️ Abriendo editor de plantillas...')
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      description: '',
      category: 'monthly',
      config: {
        title: 'Reporte Personalizado - {{month}}',
        showSummary: true,
        showCategoryBreakdown: true,
        showBudgetComparison: true,
        showCharts: false,
        customFields: []
      },
      layout: {
        header: {
          title: 'Reporte Personalizado - {{month}}',
          subtitle: 'Generado el {{date}}',
          logo: null
        },
        sections: [
          {
            type: 'summary',
            title: 'Resumen General',
            position: 'top'
          }
        ]
      }
    })
    logger.log('📝 Formulario inicializado')
    setShowEditor(true)
    logger.log('✅ Editor abierto')
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description,
      category: template.category,
      config: template.config,
      layout: template.layout
    })
    setShowEditor(true)
  }

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) {
      notifications.showSync('El nombre de la plantilla es requerido', 'error')
      return
    }

    try {
      if (editingTemplate) {
        templateEngine.updateTemplate(editingTemplate.id, templateForm)
        notifications.showSync('✅ Plantilla actualizada exitosamente', 'success')
      } else {
        templateEngine.createTemplate(templateForm)
        notifications.showSync('✅ Plantilla creada exitosamente', 'success')
      }
      
      loadTemplates()
      setShowEditor(false)
      setEditingTemplate(null)
    } catch (error) {
      logger.error('Error saving template:', error)
      notifications.showSync('❌ Error al guardar plantilla', 'error')
    }
  }

  // Función para abrir el modal de eliminación
  const openDeleteModal = useCallback((templateId, templateName) => {
    setDeleteModal({
      isOpen: true,
      templateId,
      templateName
    })
  }, [])

  // Función para cerrar el modal
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      templateId: null,
      templateName: ''
    })
  }, [])

  // Función para confirmar la eliminación
  const confirmDelete = useCallback(() => {
    try {
      templateEngine.deleteTemplate(deleteModal.templateId)
      notifications.showSync('✅ Plantilla eliminada', 'success')
      loadTemplates()
    } catch (error) {
      logger.error('Error deleting template:', error)
      notifications.showSync('❌ Error al eliminar plantilla', 'error')
    }
    closeDeleteModal()
  }, [deleteModal.templateId, closeDeleteModal])

  const handleDeleteTemplate = (template) => {
    openDeleteModal(template.id, template.name)
  }

  const handleSelectTemplate = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
    if (onClose) {
      onClose()
    }
  }

  const addSection = () => {
    const newSection = {
      type: 'summary',
      title: 'Nueva Sección',
      position: 'middle'
    }
    
    setTemplateForm(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: [...prev.layout.sections, newSection]
      }
    }))
  }

  const removeSection = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: prev.layout.sections.filter((_, i) => i !== index)
      }
    }))
  }

  const updateSection = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        sections: prev.layout.sections.map((section, i) => 
          i === index ? { ...section, [field]: value } : section
        )
      }
    }))
  }

  const sectionTypes = [
    { value: 'summary', label: 'Resumen General' },
    { value: 'category_table', label: 'Tabla de Categorías' },
    { value: 'budget_analysis', label: 'Análisis de Presupuestos' },
    { value: 'expense_list', label: 'Lista de Gastos' },
    { value: 'budget_summary', label: 'Resumen de Presupuestos' },
    { value: 'budget_table', label: 'Tabla de Presupuestos' },
    { value: 'budget_alerts', label: 'Alertas de Presupuesto' }
  ]

  logger.debug('🎨 TemplateManager render - showEditor:', showEditor)
  
  const renderModal = () => {
    if (!showEditor) return null
    
    logger.debug('📝 Renderizando editor modal')
    
    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-100">
              {editingTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
            </h2>
            <button
              onClick={() => {
                logger.log('❌ Cerrando editor')
                setShowEditor(false)
              }}
              className="text-gray-500 hover:text-zinc-300 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mi Plantilla Personalizada"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Categoría
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Mensual</option>
                  <option value="expenses">Gastos</option>
                  <option value="budget">Presupuestos</option>
                  <option value="custom">Personalizada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Descripción
              </label>
              <textarea
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Describe qué hace esta plantilla..."
              />
            </div>

            {/* Configuración del encabezado */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-4">📄 Configuración del Encabezado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={templateForm.layout.header.title}
                    onChange={(e) => setTemplateForm(prev => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        header: { ...prev.layout.header, title: e.target.value }
                      }
                    }))}
                    className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Reporte - {{month}}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Usa {'{{'} month {'}}'}, {'{{'} date {'}}'}, {'{{'} period {'}}' } para variables
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={templateForm.layout.header.subtitle}
                    onChange={(e) => setTemplateForm(prev => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        header: { ...prev.layout.header, subtitle: e.target.value }
                      }
                    }))}
                    className="w-full px-4 py-3 border border-zinc-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Generado el {{date}}"
                  />
                </div>
              </div>
            </div>

            {/* Secciones */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-100">📋 Secciones del Reporte</h3>
                <button
                  onClick={addSection}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  + Agregar Sección
                </button>
              </div>

              <div className="space-y-4">
                {templateForm.layout.sections.map((section, index) => (
                  <div key={index} className="border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-zinc-100">Sección {index + 1}</h4>
                      <button
                        onClick={() => removeSection(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Tipo de Sección
                        </label>
                        <select
                          value={section.type}
                          onChange={(e) => updateSection(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {sectionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Título de la Sección
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Título de la sección"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                onClick={() => setShowEditor(false)}
                className="px-6 py-3 border border-zinc-600 rounded-xl text-zinc-300 hover:bg-zinc-800/50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  logger.debug('📊 Renderizando lista de plantillas, total:', templates.length)
  
  return (
    <>
      {renderModal()}
      
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100">🎨 Plantillas Personalizadas</h2>
        <button
          onClick={handleCreateTemplate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
        >
          + Nueva Plantilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl p-6 shadow-lg border border-zinc-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-zinc-100 mb-1">{template.name}</h3>
                <p className="text-sm text-zinc-400 mb-2">{template.description}</p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {template.category}
                </span>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  title="Editar plantilla"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Eliminar plantilla"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="text-sm text-zinc-400">
                <strong>Secciones:</strong> {template.layout.sections.length}
              </div>
              {template.createdAt && (
                <div className="text-sm text-zinc-400">
                  <strong>Creada:</strong> {new Date(template.createdAt).toLocaleDateString('es-HN')}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSelectTemplate(template)}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Usar Plantilla
            </button>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-bold text-zinc-400 mb-2">No hay plantillas personalizadas</h3>
          <p className="text-gray-500 mb-4">Crea tu primera plantilla personalizada para reportes</p>
          <button
            onClick={handleCreateTemplate}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium"
          >
            Crear Primera Plantilla
          </button>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="¿Eliminar esta plantilla?"
        message="Esta acción no se puede deshacer."
        itemName={deleteModal.templateName}
      />
    </div>
    </>
  )
}

export default TemplateManager
