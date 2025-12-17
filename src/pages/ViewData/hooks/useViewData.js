import { useState, useEffect, useCallback } from 'react'
import database from '../../../database/index.js'
import { normalizeMany, normalizeExpense, normalizeSupermarketPurchase, normalizeCut } from '../../../utils/normalizers'
import notifications from '../../../utils/services/notifications'
import logger from '../../../utils/logger'

/**
 * Hook personalizado para gestionar los datos de ViewData
 * Maneja la carga, edición y eliminación de gastos, compras y cortes
 */
export const useViewData = (onDataChanged) => {
  const [expenses, setExpenses] = useState([])
  const [supermarketPurchases, setSupermarketPurchases] = useState([])
  const [cuts, setCuts] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  // Cargar todos los datos
  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const [expensesData, supermarketData, cutsData] = await Promise.all([
        database.getExpenses(),
        database.getSupermarketPurchases(),
        database.getCuts()
      ])

      setExpenses(normalizeMany(expensesData, normalizeExpense))
      setSupermarketPurchases(normalizeMany(supermarketData, normalizeSupermarketPurchase))
      setCuts(normalizeMany(cutsData, normalizeCut))
    } catch (error) {
      logger.error('Error loading data:', error)
      notifications.showSync('Error al cargar los datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar datos al montar
  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // Escuchar cambios en los datos desde otras ventanas
  useEffect(() => {
    const handleDataChange = async (event) => {
      // Verificar que estamos en la ruta correcta
      if (window.location.pathname !== '/view-data') {
        logger.debug('⚠️ ViewData: Evento recibido pero no estamos en /view-data, ignorando')
        return
      }
      
      // Mostrar indicador de refresh
      setRefreshing(true)
      
      // Pequeña pausa para mostrar el indicador
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Recargar datos
      await loadAllData()
      
      // Ocultar indicador de refresh
      setRefreshing(false)
    }

    const handleStorageChange = async (event) => {
      if (event.key === 'gastos_sync_trigger') {
        await handleDataChange({ detail: { timestamp: event.newValue } })
      }
    }

    logger.debug('📡 ViewData: Configurando listeners de eventos para ruta:', window.location.pathname)
    
    // Escuchar eventos de cambio de datos (CustomEvent)
    window.addEventListener('gastosDataChanged', handleDataChange)
    
    // Escuchar eventos de localStorage (más confiable entre ventanas)
    window.addEventListener('storage', handleStorageChange)

    // Limpiar los listeners al desmontar
    return () => {
      logger.debug('🧹 ViewData: Limpiando listeners de eventos')
      window.removeEventListener('gastosDataChanged', handleDataChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [loadAllData])

  // Función auxiliar para obtener o crear categoría
  const getOrCreateCategoryId = useCallback(async (categoryName) => {
    // Si la categoría es "Desconocida" o vacía, no crear categoría, usar "Otros" por defecto
    if (!categoryName || categoryName.trim() === '' || categoryName === 'Desconocida') {
      const categories = await database.getCategories()
      const otrosCategory = categories.find(cat => cat.name === 'Otros' || cat.nombre === 'Otros')
      if (otrosCategory) {
        return otrosCategory.id
      }
      // Si no existe "Otros", crear una categoría genérica
      categoryName = 'Otros'
    }
    
    const categories = await database.getCategories()
    // Buscar por name (camelCase) o nombre (snake_case) para compatibilidad
    const existingCategory = categories.find(cat => 
      (cat.name && cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase()) ||
      (cat.nombre && cat.nombre.trim().toLowerCase() === categoryName.trim().toLowerCase())
    )
    
    if (existingCategory) {
      return existingCategory.id
    } else {
      // Si no existe, intentar crearla, pero manejar el error si ya existe
      try {
        return await database.createCategory({
          name: categoryName.trim(),
          descripcion: `Categoría: ${categoryName.trim()}`
        })
      } catch (error) {
        // Si ya existe (puede ser por nombre case-insensitive), buscar de nuevo
        const categoriesAfterError = await database.getCategories()
        const foundCategory = categoriesAfterError.find(cat => 
          (cat.name && cat.name.trim().toLowerCase() === categoryName.trim().toLowerCase()) ||
          (cat.nombre && cat.nombre.trim().toLowerCase() === categoryName.trim().toLowerCase())
        )
        if (foundCategory) {
          return foundCategory.id
        }
        throw error
      }
    }
  }, [])

  // Iniciar edición
  const startEdit = useCallback((item, type) => {
    setEditingItem({ ...item, type })
    setEditForm({
      fecha: item.fecha, // Mantener la fecha exacta del item
      monto: item.monto || 0,
      descripcion: item.descripcion || '',
      categoria_nombre: item.categoria_nombre && item.categoria_nombre !== 'Desconocida' ? item.categoria_nombre : 'Otros',
      supermercado: item.supermercado || '',
      tipo_corte: item.tipo_corte || '',
      es_entrada: item.es_entrada || false,
      moneda_original: item.moneda_original || 'LPS'
    })
    logger.debug('✅ ViewData: Formulario de edición inicializado con fecha:', item.fecha)
  }, [])

  // Cancelar edición
  const cancelEdit = useCallback(() => {
    setEditingItem(null)
    setEditForm({})
  }, [])

  // Guardar edición
  const saveEdit = useCallback(async () => {
    if (!editingItem) return

    try {
      if (editingItem.type === 'gastos') {
        // Obtener el ID de la categoría seleccionada
        const categoriaId = await getOrCreateCategoryId(editForm.categoria_nombre)
        
        // Actualizar gasto
        await database.updateExpense(editingItem.id, {
          fecha: editForm.fecha,
          monto: parseFloat(editForm.monto),
          categoria_id: categoriaId,
          descripcion: editForm.descripcion,
          es_entrada: editForm.es_entrada,
          moneda_original: editForm.moneda_original
        })
        notifications.showSync('✅ Gasto actualizado correctamente', 'success')
      } else if (editingItem.type === 'supermercado') {
        // Actualizar compra de supermercado
        await database.updateSupermarketPurchase(editingItem.id, {
          fecha: editForm.fecha,
          monto: parseFloat(editForm.monto),
          descripcion: editForm.descripcion,
          supermercado: editForm.supermercado
        })
        notifications.showSync('✅ Compra de supermercado actualizada correctamente', 'success')
      } else if (editingItem.type === 'cortes') {
        // Actualizar corte
        await database.updateCut(editingItem.id, {
          fecha: editForm.fecha,
          tipo_corte: editForm.tipo_corte,
          descripcion: `Corte: ${editForm.tipo_corte}`
        })
        notifications.showSync('✅ Corte actualizado correctamente', 'success')
      }

      // Recargar datos
      await loadAllData()
      
      // Notificar cambios
      if (onDataChanged) {
        onDataChanged()
      }

      // Limpiar edición
      cancelEdit()
    } catch (error) {
      logger.error('Error updating item:', error)
      notifications.showSync('❌ Error al actualizar el registro', 'error')
    }
  }, [editingItem, editForm, getOrCreateCategoryId, loadAllData, onDataChanged, cancelEdit])

  // Eliminar item
  const deleteItem = useCallback(async (id, type) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return
    }

    try {
      if (type === 'gastos') {
        await database.deleteExpense(id)
        notifications.showSync('✅ Gasto eliminado correctamente', 'success')
      } else if (type === 'supermercado') {
        await database.deleteSupermarketPurchase(id)
        notifications.showSync('✅ Compra de supermercado eliminada correctamente', 'success')
      } else if (type === 'cortes') {
        await database.deleteCut(id)
        notifications.showSync('✅ Corte eliminado correctamente', 'success')
      }

      // Recargar datos
      await loadAllData()
      
      // Notificar cambios
      if (onDataChanged) {
        onDataChanged()
      }
    } catch (error) {
      logger.error('Error deleting item:', error)
      notifications.showSync('❌ Error al eliminar el registro', 'error')
    }
  }, [loadAllData, onDataChanged])

  return {
    // Datos
    expenses,
    supermarketPurchases,
    cuts,
    loading,
    refreshing,
    
    // Edición
    editingItem,
    editForm,
    setEditForm,
    startEdit,
    cancelEdit,
    saveEdit,
    
    // Eliminación
    deleteItem,
    
    // Recarga
    loadAllData
  }
}
