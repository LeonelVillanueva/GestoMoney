/**
 * Motor de plantillas para generar reportes PDF personalizados
 */
import jsPDF from 'jspdf'
import 'jspdf-autotable'

class TemplateEngine {
  constructor() {
    this.storageKey = 'gastos_templates'
  }

  /**
   * Obtener todas las plantillas
   * @returns {Array} Array de plantillas
   */
  getTemplates() {
    try {
      const templatesJson = localStorage.getItem(this.storageKey)
      if (!templatesJson) {
        return []
      }
      return JSON.parse(templatesJson)
    } catch (error) {
      console.error('Error loading templates:', error)
      return []
    }
  }

  /**
   * Guardar todas las plantillas
   * @param {Array} templates - Array de plantillas
   */
  saveTemplates(templates) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(templates))
    } catch (error) {
      console.error('Error saving templates:', error)
      throw error
    }
  }

  /**
   * Crear una nueva plantilla
   * @param {Object} templateData - Datos de la plantilla
   * @returns {Object} Plantilla creada
   */
  createTemplate(templateData) {
    const templates = this.getTemplates()
    const newTemplate = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...templateData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    templates.push(newTemplate)
    this.saveTemplates(templates)
    return newTemplate
  }

  /**
   * Actualizar una plantilla existente
   * @param {string} templateId - ID de la plantilla
   * @param {Object} templateData - Nuevos datos de la plantilla
   * @returns {Object} Plantilla actualizada
   */
  updateTemplate(templateId, templateData) {
    const templates = this.getTemplates()
    const index = templates.findIndex(t => t.id === templateId)
    
    if (index === -1) {
      throw new Error('Plantilla no encontrada')
    }

    templates[index] = {
      ...templates[index],
      ...templateData,
      updatedAt: new Date().toISOString()
    }
    
    this.saveTemplates(templates)
    return templates[index]
  }

  /**
   * Eliminar una plantilla
   * @param {string} templateId - ID de la plantilla
   */
  deleteTemplate(templateId) {
    const templates = this.getTemplates()
    const filtered = templates.filter(t => t.id !== templateId)
    
    if (filtered.length === templates.length) {
      throw new Error('Plantilla no encontrada')
    }
    
    this.saveTemplates(filtered)
  }

  /**
   * Obtener una plantilla por ID
   * @param {string} templateId - ID de la plantilla
   * @returns {Object|null} Plantilla o null si no existe
   */
  getTemplateById(templateId) {
    const templates = this.getTemplates()
    return templates.find(t => t.id === templateId) || null
  }

  /**
   * Generar PDF desde una plantilla
   * @param {string} templateId - ID de la plantilla
   * @param {Object} data - Datos para rellenar la plantilla
   * @returns {jsPDF} Documento PDF generado
   */
  generatePDFFromTemplate(templateId, data) {
    const template = this.getTemplateById(templateId)
    
    if (!template) {
      throw new Error('Plantilla no encontrada')
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Procesar header
    if (template.layout && template.layout.header) {
      const header = template.layout.header
      let title = this.replacePlaceholders(header.title || '', data)
      let subtitle = this.replacePlaceholders(header.subtitle || '', data)

      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      if (subtitle) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' })
        yPosition += 15
      }
    }

    // Procesar secciones
    if (template.layout && template.layout.sections) {
      template.layout.sections.forEach(section => {
        yPosition = this.renderSection(doc, section, data, yPosition, pageWidth, pageHeight)
      })
    }

    // Renderizar datos según configuración
    if (template.config) {
      if (template.config.showSummary && data.expenses) {
        yPosition = this.renderSummary(doc, data, yPosition, pageWidth, pageHeight)
      }

      if (template.config.showCategoryBreakdown && data.expenses) {
        yPosition = this.renderCategoryBreakdown(doc, data, yPosition, pageWidth, pageHeight)
      }

      if (template.config.showBudgetComparison && data.budgets && data.expenses) {
        yPosition = this.renderBudgetComparison(doc, data, yPosition, pageWidth, pageHeight)
      }
    }

    return doc
  }

  /**
   * Reemplazar placeholders en texto
   * @param {string} text - Texto con placeholders
   * @param {Object} data - Datos para reemplazar
   * @returns {string} Texto con placeholders reemplazados
   */
  replacePlaceholders(text, data) {
    if (!text) return ''
    
    return text
      .replace(/\{\{month\}\}/g, data.month || '')
      .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('es-HN'))
      .replace(/\{\{period\}\}/g, data.period || '')
  }

  /**
   * Renderizar una sección del documento
   * @param {jsPDF} doc - Documento PDF
   * @param {Object} section - Configuración de la sección
   * @param {Object} data - Datos
   * @param {number} yPosition - Posición Y actual
   * @param {number} pageWidth - Ancho de página
   * @param {number} pageHeight - Alto de página
   * @returns {number} Nueva posición Y
   */
  renderSection(doc, section, data, yPosition, pageWidth, pageHeight) {
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = 20
    }

    if (section.title) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(section.title, 14, yPosition)
      yPosition += 10
    }

    // Renderizar según tipo de sección
    switch (section.type) {
      case 'summary':
        return this.renderSummary(doc, data, yPosition, pageWidth, pageHeight)
      case 'categoryBreakdown':
        return this.renderCategoryBreakdown(doc, data, yPosition, pageWidth, pageHeight)
      case 'budgetComparison':
        return this.renderBudgetComparison(doc, data, yPosition, pageWidth, pageHeight)
      default:
        return yPosition
    }
  }

  /**
   * Renderizar resumen
   */
  renderSummary(doc, data, yPosition, pageWidth, pageHeight) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    if (!data.expenses || data.expenses.length === 0) {
      doc.setFontSize(12)
      doc.text('No hay datos disponibles', 14, yPosition)
      return yPosition + 10
    }

    const total = data.expenses.reduce((sum, exp) => sum + (parseFloat(exp.monto) || 0), 0)
    const count = data.expenses.length

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de gastos: ${this.formatCurrency(total)}`, 14, yPosition)
    yPosition += 7
    doc.text(`Cantidad de transacciones: ${count}`, 14, yPosition)
    yPosition += 7
    doc.text(`Promedio por transacción: ${this.formatCurrency(total / count)}`, 14, yPosition)
    
    return yPosition + 15
  }

  /**
   * Renderizar desglose por categoría
   */
  renderCategoryBreakdown(doc, data, yPosition, pageWidth, pageHeight) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    if (!data.expenses || data.expenses.length === 0) {
      return yPosition
    }

    // Agrupar por categoría
    const categoryMap = {}
    data.expenses.forEach(exp => {
      const cat = exp.categoria_nombre || 'Otros'
      if (!categoryMap[cat]) {
        categoryMap[cat] = 0
      }
      categoryMap[cat] += parseFloat(exp.monto) || 0
    })

    const tableData = Object.entries(categoryMap).map(([cat, amount]) => [
      cat,
      this.formatCurrency(amount)
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Categoría', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] }
    })

    return doc.lastAutoTable.finalY + 10
  }

  /**
   * Renderizar comparación de presupuestos
   */
  renderBudgetComparison(doc, data, yPosition, pageWidth, pageHeight) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    if (!data.budgets || data.budgets.length === 0) {
      return yPosition
    }

    const tableData = data.budgets.map(budget => {
      const spent = (data.expenses || [])
        .filter(e => e.categoria_id === budget.categoria_id)
        .reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0)
      const remaining = parseFloat(budget.monto) - spent
      
      return [
        budget.categoria_nombre || 'Sin categoría',
        this.formatCurrency(budget.monto),
        this.formatCurrency(spent),
        this.formatCurrency(remaining),
        `${((spent / budget.monto) * 100).toFixed(1)}%`
      ]
    })

    doc.autoTable({
      startY: yPosition,
      head: [['Categoría', 'Presupuesto', 'Gastado', 'Restante', 'Porcentaje']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] }
    })

    return doc.lastAutoTable.finalY + 10
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount)
  }
}

// Exportar instancia singleton
const templateEngine = new TemplateEngine()
export default templateEngine
