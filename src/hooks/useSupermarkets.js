import { useCallback, useEffect, useState } from 'react'
import database from '../database/index.js'
import notifications from '../utils/services/notifications'

export default function useSupermarkets(active) {
  const [newSupermarket, setNewSupermarket] = useState('')
  const [editingSupermarket, setEditingSupermarket] = useState(null)
  const [list, setList] = useState([])

  const load = useCallback(async () => {
    try {
      const cfg = await database.getAllConfig()
      const arr = cfg.supermercados_por_defecto ? JSON.parse(cfg.supermercados_por_defecto) : []
      setList(arr)
    } catch (e) {
      console.error('Error loading supermarkets:', e)
      notifications.showSync('Error al cargar supermercados', 'error')
    }
  }, [])

  const add = useCallback(async () => {
    if (!newSupermarket.trim()) {
      notifications.showSync('El nombre del supermercado es requerido', 'error')
      return
    }
    if (list.includes(newSupermarket)) {
      notifications.showSync('Este supermercado ya existe', 'error')
      return
    }
    const updated = [...list, newSupermarket]
    const result = await database.setConfig('supermercados_por_defecto', JSON.stringify(updated))
    setNewSupermarket('')
    if (result?.queued) {
      setList(updated)
      notifications.showSync('Sin conexión: supermercado pendiente de sincronización', 'warning')
      return
    }
    await load()
    notifications.showSync('✅ Supermercado agregado', 'success')
  }, [newSupermarket, list, load])

  // skipConfirm: si es true, no muestra window.confirm (usado cuando ya se confirmó con PIN)
  const removeItem = useCallback(async (name, skipConfirm = false) => {
    if (!skipConfirm) {
      const confirmed = await notifications.confirm({
        title: 'Eliminar supermercado',
        message: `¿Eliminar "${name}" de la lista de supermercados?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        tone: 'danger'
      })
      if (!confirmed) return
    }
    const updated = list.filter(s => s !== name)
    const result = await database.setConfig('supermercados_por_defecto', JSON.stringify(updated))
    if (result?.queued) {
      setList(updated)
      notifications.showSync('Sin conexión: eliminación pendiente de sincronización', 'warning')
      return
    }
    await load()
    notifications.showSync('✅ Supermercado eliminado', 'success')
  }, [list, load])

  const update = useCallback(async (oldName, newName) => {
    if (!newName.trim()) {
      notifications.showSync('El nombre del supermercado es requerido', 'error')
      return
    }
    if (list.includes(newName) && newName !== oldName) {
      notifications.showSync('Este supermercado ya existe', 'error')
      return
    }
    const updated = list.map(s => s === oldName ? newName : s)
    const result = await database.setConfig('supermercados_por_defecto', JSON.stringify(updated))
    setEditingSupermarket(null)
    if (result?.queued) {
      setList(updated)
      notifications.showSync('Sin conexión: actualización pendiente de sincronización', 'warning')
      return
    }
    await load()
    notifications.showSync('✅ Supermercado actualizado', 'success')
  }, [list, load])

  useEffect(() => {
    if (active) load()
  }, [active, load])

  return {
    supermarkets: list,
    newSupermarket,
    setNewSupermarket,
    editingSupermarket,
    setEditingSupermarket,
    loadSupermarkets: load,
    addSupermarket: add,
    deleteSupermarket: removeItem,
    updateSupermarket: update,
  }
}






