import { useCallback, useEffect, useState } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'

export default function useCategories(active) {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3498db', icon: '💰' })
  const [editingCategory, setEditingCategory] = useState(null)

  const loadCategories = useCallback(async () => {
    try {
      const cats = await database.getCategories()
      setCategories(cats)
    } catch (error) {
      console.error('Error loading categories:', error)
      notifications.showSync('Error al cargar categorías', 'error')
    }
  }, [])

  const addCategory = useCallback(async () => {
    if (!newCategory.name.trim()) {
      notifications.showSync('El nombre de la categoría es requerido', 'error')
      return
    }
    try {
      const result = await database.createCategory(newCategory)
      if (result?.queued) {
        notifications.showSync('No se puede crear categorías sin conexión. Intenta nuevamente al reconectar.', 'error')
        return
      }
      await loadCategories()
      setNewCategory({ name: '', color: '#3498db', icon: '💰' })
      notifications.showSync('✅ Categoría agregada exitosamente', 'success')
    } catch (error) {
      console.error('Error adding category:', error)
      notifications.showSync('Error al agregar categoría', 'error')
    }
  }, [newCategory, loadCategories])

  // skipConfirm: si es true, no muestra window.confirm (usado cuando ya se confirmó con PIN)
  const deleteCategory = useCallback(async (categoryId, skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = await notifications.confirm({
        title: 'Eliminar categoría',
        message: '¿Estás seguro de que quieres eliminar esta categoría?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        tone: 'danger'
      })
      if (!confirmed) return
    }
    try {
      const result = await database.deleteCategory(categoryId)
      if (result?.queued) {
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
        notifications.showSync('Sin conexión: eliminación pendiente de sincronización', 'warning')
        return
      }
      await loadCategories()
      notifications.showSync('✅ Categoría eliminada', 'success')
    } catch (error) {
      console.error('Error deleting category:', error)
      notifications.showSync('Error al eliminar categoría', 'error')
    }
  }, [loadCategories])

  const updateCategory = useCallback(async (categoryId, updates) => {
    try {
      const result = await database.updateCategory(categoryId, updates)
      if (result?.queued) {
        setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, ...updates } : cat)))
        setEditingCategory(null)
        notifications.showSync('Sin conexión: actualización pendiente de sincronización', 'warning')
        return
      }
      await loadCategories()
      setEditingCategory(null)
      notifications.showSync('✅ Categoría actualizada', 'success')
    } catch (error) {
      console.error('Error updating category:', error)
      notifications.showSync('Error al actualizar categoría', 'error')
    }
  }, [loadCategories])

  useEffect(() => {
    if (active) loadCategories()
  }, [active, loadCategories])

  return {
    categories,
    newCategory,
    setNewCategory,
    editingCategory,
    setEditingCategory,
    loadCategories,
    addCategory,
    deleteCategory,
    updateCategory,
  }
}






