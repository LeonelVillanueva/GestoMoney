import { useState, useCallback } from 'react'
import database from '../../../database/index.js'
import notifications from '../../../utils/services/notifications'
import { getOrCreateCategoryId } from '../utils/viewDataHelpers'

/**
 * Hook personalizado para gestionar la edición de datos en ViewData
 */
export const useDataEditing = (loadAllData, onDataChanged) => {
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({})

  const startEdit = useCallback((item, type) => {
    setEditingItem({ ...item, type })
    setEditForm({
      fecha: item.fecha,
      monto: item.monto || 0,
      descripcion: item.descripcion || '',
      categoria_nombre: item.categoria_nombre && item.categoria_nombre !== 'Desconocida' ? item.categoria_nombre : 'Otros',
      supermercado: item.supermercado || '',
      tipo_corte: item.tipo_corte || '',
      es_entrada: item.es_entrada || false,
      moneda_original: item.moneda_original || 'LPS'
    })
    console.log('✅ ViewData: Formulario de edición inicializado con fecha:', item.fecha)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingItem(null)
    setEditForm({})
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editingItem) return

    try {
      if (editingItem.type === 'gastos') {
        const categoriaId = await getOrCreateCategoryId(editForm.categoria_nombre)
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
        await database.updateSupermarketPurchase(editingItem.id, {
          fecha: editForm.fecha,
          monto: parseFloat(editForm.monto),
          descripcion: editForm.descripcion,
          supermercado: editForm.supermercado
        })
        notifications.showSync('✅ Compra de supermercado actualizada correctamente', 'success')
      } else if (editingItem.type === 'cortes') {
        await database.updateCut(editingItem.id, {
          fecha: editForm.fecha,
          tipo_corte: editForm.tipo_corte,
          descripcion: `Corte: ${editForm.tipo_corte}`
        })
        notifications.showSync('✅ Corte actualizado correctamente', 'success')
      }

      await loadAllData()
      if (onDataChanged) {
        onDataChanged()
      }
      cancelEdit()
    } catch (error) {
      console.error('Error updating item:', error)
      notifications.showSync('❌ Error al actualizar el registro', 'error')
    }
  }, [editingItem, editForm, loadAllData, onDataChanged, cancelEdit])

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

      await loadAllData()
      if (onDataChanged) {
        onDataChanged()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      notifications.showSync('❌ Error al eliminar el registro', 'error')
    }
  }, [loadAllData, onDataChanged])

  return {
    editingItem,
    editForm,
    setEditForm,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteItem
  }
}

