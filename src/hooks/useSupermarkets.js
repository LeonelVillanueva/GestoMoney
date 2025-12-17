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
    await database.setConfig('supermercados_por_defecto', JSON.stringify(updated))
    setNewSupermarket('')
    await load()
    notifications.showSync('✅ Supermercado agregado', 'success')
  }, [newSupermarket, list, load])

  const removeItem = useCallback(async (name) => {
    const confirmed = window.confirm(`¿Eliminar "${name}"?`)
    if (!confirmed) return
    const updated = list.filter(s => s !== name)
    await database.setConfig('supermercados_por_defecto', JSON.stringify(updated))
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
    await database.setConfig('supermercados_por_defecto', JSON.stringify(updated))
    setEditingSupermarket(null)
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






