import { useCallback, useEffect, useState } from 'react'
import database from '../database/index.js'

export default function useSnapshots(active) {
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(false)

  const loadSnapshots = useCallback(async () => {
    try {
      setLoading(true)
      const snaps = await database.listSnapshots()
      setSnapshots(Array.isArray(snaps) ? snaps : [])
    } finally {
      setLoading(false)
    }
  }, [])

  const createSnapshot = useCallback(async () => {
    await database.createSnapshot()
    await loadSnapshots()
  }, [loadSnapshots])

  const restoreLatest = useCallback(async () => {
    const snaps = await database.listSnapshots()
    if (!snaps || snaps.length === 0) return false
    return database.restoreSnapshot(snaps[0].id)
  }, [])

  const restoreById = useCallback(async (id) => {
    return database.restoreSnapshot(id)
  }, [])

  const deleteById = useCallback(async (id) => {
    await database.deleteSnapshot(id)
    await loadSnapshots()
  }, [loadSnapshots])

  const downloadSnapshot = useCallback((snap) => {
    const blob = new Blob([JSON.stringify(snap.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snapshot-${snap.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [])

  useEffect(() => {
    if (active) {
      loadSnapshots()
    }
  }, [active, loadSnapshots])

  return {
    snapshots,
    loadingSnapshots: loading,
    loadSnapshots,
    createSnapshot,
    restoreLatest,
    restoreById,
    deleteById,
    downloadSnapshot,
  }
}






