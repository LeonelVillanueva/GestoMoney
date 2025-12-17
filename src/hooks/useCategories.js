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
      await database.createCategory(newCategory)
      await loadCategories()
      setNewCategory({ name: '', color: '#3498db', icon: '💰' })
      notifications.showSync('✅ Categoría agregada exitosamente', 'success')
    } catch (error) {
      console.error('Error adding category:', error)
      notifications.showSync('Error al agregar categoría', 'error')
    }
  }, [newCategory, loadCategories])

  const deleteCategory = useCallback(async (categoryId) => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')
    if (!confirmed) return
    try {
      await database.deleteCategory(categoryId)
      await loadCategories()
      notifications.showSync('✅ Categoría eliminada', 'success')
    } catch (error) {
      console.error('Error deleting category:', error)
      notifications.showSync('Error al eliminar categoría', 'error')
    }
  }, [loadCategories])

  const updateCategory = useCallback(async (categoryId, updates) => {
    try {
      await database.updateCategory(categoryId, updates)
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






