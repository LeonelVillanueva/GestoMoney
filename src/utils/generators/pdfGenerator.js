/**
 * Generador de PDFs para reportes estándar
 */
import jsPDF from 'jspdf'
import 'jspdf-autotable'

class PDFGenerator {
  constructor() {
    this.isAvailable = typeof jsPDF !== 'undefined'
  }

  /**
   * Probar si el generador funciona
   * @returns {boolean} true si funciona
   */
  testGenerator() {
    try {
      const doc = new jsPDF()
      doc.text('Test', 10, 10)
      return true
    } catch (error) {
      console.error('Error testing PDF generator:', error)
      return false
    }
  }

  /**
   * Generar y descargar un reporte PDF
   * @param {string} reportType - Tipo de reporte ('monthly', 'category', 'budget', 'period')
   * @param {Object} data - Datos del reporte
   * @param {string} filename - Nombre del archivo
   * @returns {boolean} true si se generó exitosamente
   */
  generateAndDownload(reportType, data, filename) {
    try {
      const doc = this.generateReport(reportType, data)
      doc.save(filename)
      return true
    } catch (error) {
      console.error('Error generating PDF:', error)
      return false
    }
  }

  /**
   * Generar un reporte PDF
   * @param {string} reportType - Tipo de reporte
   * @param {Object} data - Datos del reporte
   * @returns {jsPDF} Documento PDF generado
   */
  generateReport(reportType, data) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPosition = 20

    // Título del reporte
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const title = this.getReportTitle(reportType, data)
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Fecha de generación
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-HN')}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 20

    // Generar contenido según tipo
    switch (reportType) {
      case 'monthly':
        yPosition = this.generateMonthlyReport(doc, data, yPosition)
        break
      case 'category':
        yPosition = this.generateCategoryReport(doc, data, yPosition)
        break
      case 'budget':
        yPosition = this.generateBudgetReport(doc, data, yPosition)
        break
      case 'period':
        yPosition = this.generatePeriodReport(doc, data, yPosition)
        break
      default:
        doc.text('Tipo de reporte no válido', 14, yPosition)
    }

    return doc
  }

  /**
   * Obtener título del reporte
   */
  getReportTitle(reportType, data) {
    const titles = {
      monthly: `Reporte Mensual - ${data.month || 'Mes actual'}`,
      category: 'Reporte por Categoría',
      budget: 'Reporte de Presupuestos',
      period: `Reporte del ${data.startDate} al ${data.endDate}`
    }
    return titles[reportType] || 'Reporte de Gastos'
  }

  /**
   * Generar reporte mensual
   */
  generateMonthlyReport(doc, data, yPosition) {
    if (!data.expenses || data.expenses.length === 0) {
      doc.text('No hay gastos para este período', 14, yPosition)
      return yPosition + 10
    }

    // Resumen general
    const total = data.expenses.reduce((sum, exp) => sum + (parseFloat(exp.monto) || 0), 0)
    const count = data.expenses.length
    const average = total / count

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen General', 14, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total de gastos: ${this.formatCurrency(total)}`, 14, yPosition)
    yPosition += 7
    doc.text(`Cantidad de transacciones: ${count}`, 14, yPosition)
    yPosition += 7
    doc.text(`Promedio por transacción: ${this.formatCurrency(average)}`, 14, yPosition)
    yPosition += 15

    // Desglose por categoría
    if (data.expenses.length > 0) {
      const categoryMap = {}
      data.expenses.forEach(exp => {
        const cat = exp.categoria_nombre || 'Otros'
        if (!categoryMap[cat]) {
          categoryMap[cat] = 0
        }
        categoryMap[cat] += parseFloat(exp.monto) || 0
      })

      const tableData = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => [cat, this.formatCurrency(amount)])

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Gastos por Categoría', 14, yPosition)
      yPosition += 10

      doc.autoTable({
        startY: yPosition,
        head: [['Categoría', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
      })

      yPosition = doc.lastAutoTable.finalY + 10
    }

    // Comparación con presupuestos si están disponibles
    if (data.budgets && data.budgets.length > 0) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Comparación con Presupuestos', 14, yPosition)
      yPosition += 10

      const budgetTableData = data.budgets.map(budget => {
        const spent = (data.expenses || [])
          .filter(e => e.categoria_id === budget.categoria_id)
          .reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0)
        const remaining = parseFloat(budget.monto) - spent
        const percentage = ((spent / budget.monto) * 100).toFixed(1)

        return [
          budget.categoria_nombre || 'Sin categoría',
          this.formatCurrency(budget.monto),
          this.formatCurrency(spent),
          this.formatCurrency(remaining),
          `${percentage}%`
        ]
      })

      doc.autoTable({
        startY: yPosition,
        head: [['Categoría', 'Presupuesto', 'Gastado', 'Restante', 'Porcentaje']],
        body: budgetTableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
      })

      yPosition = doc.lastAutoTable.finalY + 10
    }

    return yPosition
  }

  /**
   * Generar reporte por categoría
   */
  generateCategoryReport(doc, data, yPosition) {
    if (!data.expenses || data.expenses.length === 0) {
      doc.text('No hay gastos disponibles', 14, yPosition)
      return yPosition + 10
    }

    const categoryMap = {}
    data.expenses.forEach(exp => {
      const cat = exp.categoria_nombre || 'Otros'
      if (!categoryMap[cat]) {
        categoryMap[cat] = []
      }
      categoryMap[cat].push(exp)
    })

    Object.entries(categoryMap).forEach(([category, expenses]) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      const categoryTotal = expenses.reduce((sum, exp) => sum + (parseFloat(exp.monto) || 0), 0)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`${category} - Total: ${this.formatCurrency(categoryTotal)}`, 14, yPosition)
      yPosition += 10

      const tableData = expenses.map(exp => [
        exp.fecha || '',
        exp.descripcion || '',
        this.formatCurrency(parseFloat(exp.monto) || 0)
      ])

      doc.autoTable({
        startY: yPosition,
        head: [['Fecha', 'Descripción', 'Monto']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
      })

      yPosition = doc.lastAutoTable.finalY + 15
    })

    return yPosition
  }

  /**
   * Generar reporte de presupuestos
   */
  generateBudgetReport(doc, data, yPosition) {
    if (!data.budgets || data.budgets.length === 0) {
      doc.text('No hay presupuestos disponibles', 14, yPosition)
      return yPosition + 10
    }

    const tableData = data.budgets.map(budget => {
      const spent = (data.expenses || [])
        .filter(e => e.categoria_id === budget.categoria_id)
        .reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0)
      const remaining = parseFloat(budget.monto) - spent
      const percentage = budget.monto > 0 ? ((spent / budget.monto) * 100).toFixed(1) : '0.0'

      return [
        budget.categoria_nombre || 'Sin categoría',
        this.formatCurrency(budget.monto),
        this.formatCurrency(spent),
        this.formatCurrency(remaining),
        `${percentage}%`
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
   * Generar reporte por período
   */
  generatePeriodReport(doc, data, yPosition) {
    if (!data.expenses || data.expenses.length === 0) {
      doc.text('No hay gastos para este período', 14, yPosition)
      return yPosition + 10
    }

    // Resumen
    const total = data.expenses.reduce((sum, exp) => sum + (parseFloat(exp.monto) || 0), 0)
    const count = data.expenses.length

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen del Período', 14, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${data.startDate} al ${data.endDate}`, 14, yPosition)
    yPosition += 7
    doc.text(`Total: ${this.formatCurrency(total)}`, 14, yPosition)
    yPosition += 7
    doc.text(`Transacciones: ${count}`, 14, yPosition)
    yPosition += 15

    // Tabla de gastos
    const tableData = data.expenses.map(exp => [
      exp.fecha || '',
      exp.categoria_nombre || 'Otros',
      exp.descripcion || '',
      this.formatCurrency(parseFloat(exp.monto) || 0)
    ])

    doc.autoTable({
      startY: yPosition,
      head: [['Fecha', 'Categoría', 'Descripción', 'Monto']],
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
const pdfGenerator = new PDFGenerator()
export default pdfGenerator
