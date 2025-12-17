import { useCallback, useEffect, useState } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'

export default function useCuts(active) {
  const [cuts, setCuts] = useState([])
  const [newCutType, setNewCutType] = useState('')
  const [editingCutType, setEditingCutType] = useState(null)

  const loadCuts = useCallback(async () => {
    try {
      const cutsData = await database.getCuts()
      const uniqueTypes = [...new Set(cutsData.map(cut => cut.tipo_corte))]
      setCuts(uniqueTypes)
    } catch (error) {
      console.error('Error loading cuts:', error)
      notifications.showSync('Error al cargar tipos de corte', 'error')
    }
  }, [])

  const addCutType = useCallback(async () => {
    if (!newCutType.trim()) {
      notifications.showSync('El nombre del tipo de corte es requerido', 'error')
      return
    }
    if (cuts.includes(newCutType)) {
      notifications.showSync('Este tipo de corte ya existe', 'error')
      return
    }
    try {
      const currentTypes = (await database.getAllConfig()).tipos_corte_por_defecto
      const parsed = currentTypes ? JSON.parse(currentTypes) : []
      const updated = [...parsed, newCutType]
      await database.setConfig('tipos_corte_por_defecto', JSON.stringify(updated))
      setNewCutType('')
      await loadCuts()
      notifications.showSync('✅ Tipo de corte agregado exitosamente', 'success')
    } catch (error) {
      console.error('Error adding cut type:', error)
      notifications.showSync('Error al agregar tipo de corte', 'error')
    }
  }, [newCutType, cuts, loadCuts])

  const deleteCutType = useCallback(async (cutType) => {
    const confirmed = window.confirm(`¿Eliminar el tipo de corte "${cutType}"?`)
    if (!confirmed) return
    try {
      const currentTypes = (await database.getAllConfig()).tipos_corte_por_defecto
      const parsed = currentTypes ? JSON.parse(currentTypes) : []
      const updated = parsed.filter(type => type !== cutType)
      await database.setConfig('tipos_corte_por_defecto', JSON.stringify(updated))
      await loadCuts()
      notifications.showSync('✅ Tipo de corte eliminado', 'success')
    } catch (error) {
      console.error('Error deleting cut type:', error)
      notifications.showSync('Error al eliminar tipo de corte', 'error')
    }
  }, [loadCuts])

  const updateCutType = useCallback(async (oldType, newType) => {
    if (!newType.trim()) {
      notifications.showSync('El nombre del tipo de corte es requerido', 'error')
      return
    }
    if (cuts.includes(newType) && newType !== oldType) {
      notifications.showSync('Este tipo de corte ya existe', 'error')
      return
    }
    try {
      const currentTypes = (await database.getAllConfig()).tipos_corte_por_defecto
      const parsed = currentTypes ? JSON.parse(currentTypes) : []
      const updated = parsed.map(type => type === oldType ? newType : type)
      await database.setConfig('tipos_corte_por_defecto', JSON.stringify(updated))
      setEditingCutType(null)
      await loadCuts()
      notifications.showSync('✅ Tipo de corte actualizado', 'success')
    } catch (error) {
      console.error('Error updating cut type:', error)
      notifications.showSync('Error al actualizar tipo de corte', 'error')
    }
  }, [cuts, loadCuts])

  useEffect(() => {
    if (active) loadCuts()
  }, [active, loadCuts])

  return {
    cuts,
    newCutType,
    setNewCutType,
    editingCutType,
    setEditingCutType,
    loadCuts,
    addCutType,
    deleteCutType,
    updateCutType,
  }
}






