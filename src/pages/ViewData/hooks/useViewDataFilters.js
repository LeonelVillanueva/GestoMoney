import { useState, useEffect, useCallback, useMemo } from 'react'
import { parseDateLocal, compareDates, isDateInRange } from '../../../utils/normalizers'
import database from '../../../database/index.js'

/**
 * Hook personalizado para gestionar filtros y categorías en ViewData
 */
export const useViewDataFilters = (activeTab) => {
  const [searchFilters, setSearchFilters] = useState({
    searchText: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    transactionType: '',
    minAmount: '',
    maxAmount: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [availableCategories, setAvailableCategories] = useState([])

  // Cargar categorías desde la base de datos
  const loadCategories = useCallback(async () => {
    try {
      const cats = await database.getCategories()
      // Extraer nombres de categorías (soporta name y nombre para compatibilidad)
      const categoryNames = cats
        .map(cat => cat.name || cat.nombre || '')
        .filter(name => name && name.trim() && name !== 'Desconocida')
      
      // Eliminar duplicados (insensible a mayúsculas/minúsculas)
      const uniqueCategories = []
      const seen = new Set()
      
      categoryNames.forEach(name => {
        const normalizedName = name.trim().toLowerCase()
        if (normalizedName && !seen.has(normalizedName)) {
          seen.add(normalizedName)
          // Mantener la capitalización original del primer encuentro
          uniqueCategories.push(name.trim())
        }
      })
      
      setAvailableCategories(uniqueCategories.length > 0 ? uniqueCategories : [
        'Comida', 'Transporte', 'Entretenimiento', 'Regalos', 
        'Utilidades', 'Salud', 'Educación', 'Tecnología', 'Otros'
      ])
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback a categorías por defecto
      setAvailableCategories([
        'Comida', 'Transporte', 'Entretenimiento', 'Regalos', 
        'Utilidades', 'Salud', 'Educación', 'Tecnología', 'Otros'
      ])
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Función optimizada para manejar cambios en la búsqueda
  const handleSearchChange = useCallback((value) => {
    setSearchFilters(prev => ({ ...prev, searchText: value }))
  }, [])

  // Función optimizada para manejar cambios en otros filtros
  const handleFilterChange = useCallback((filterName, value) => {
    setSearchFilters(prev => ({ ...prev, [filterName]: value }))
  }, [])

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setSearchFilters({
      searchText: '',
      dateFrom: '',
      dateTo: '',
      category: '',
      transactionType: '',
      minAmount: '',
      maxAmount: ''
    })
  }, [])

  // Memoizar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.values(searchFilters).some(value => value !== '')
  }, [searchFilters])

  // Aplicar filtros a los datos
  const applyFilters = useCallback((data, type) => {
    if (!data || data.length === 0) return data

    return data.filter(item => {
      // Filtro por texto de búsqueda (descripción)
      if (searchFilters.searchText) {
        const searchLower = searchFilters.searchText.toLowerCase()
        const description = (item.descripcion || '').toLowerCase()
        const category = (item.categoria_nombre || '').toLowerCase()
        const supermarket = (item.supermercado || '').toLowerCase()
        const cutType = (item.tipo_corte || '').toLowerCase()
        
        if (!description.includes(searchLower) && 
            !category.includes(searchLower) && 
            !supermarket.includes(searchLower) && 
            !cutType.includes(searchLower)) {
          return false
        }
      }

      // Filtro por rango de fechas
      if (searchFilters.dateFrom || searchFilters.dateTo) {
        const itemDate = parseDateLocal(item.fecha)
        if (!itemDate) return false
        
        if (searchFilters.dateFrom && searchFilters.dateTo) {
          if (!isDateInRange(itemDate, searchFilters.dateFrom, searchFilters.dateTo)) return false
        } else if (searchFilters.dateFrom) {
          const fromDate = parseDateLocal(searchFilters.dateFrom)
          if (!fromDate) return false
          const comparison = compareDates(itemDate, fromDate)
          if (comparison === null || comparison === -1) return false
        } else if (searchFilters.dateTo) {
          const toDate = parseDateLocal(searchFilters.dateTo)
          if (!toDate) return false
          const comparison = compareDates(itemDate, toDate)
          if (comparison === null || comparison === 1) return false
        }
      }

      // Filtro por categoría (solo para gastos)
      if (searchFilters.category && type === 'gastos') {
        if (item.categoria_nombre !== searchFilters.category) return false
      }

      // Filtro por tipo de transacción (solo para gastos)
      if (searchFilters.transactionType && type === 'gastos') {
        const isIngreso = item.es_entrada || false
        if (searchFilters.transactionType === 'ingresos' && !isIngreso) return false
        if (searchFilters.transactionType === 'gastos' && isIngreso) return false
      }

      // Filtro por rango de montos (solo para gastos y supermercado)
      if ((searchFilters.minAmount || searchFilters.maxAmount) && (type === 'gastos' || type === 'supermercado')) {
        const amount = parseFloat(item.monto) || 0
        const minAmount = parseFloat(searchFilters.minAmount) || 0
        const maxAmount = parseFloat(searchFilters.maxAmount) || Infinity

        if (amount < minAmount || amount > maxAmount) return false
      }

      return true
    })
  }, [searchFilters])

  // Resetear filtros cuando cambie de tab
  useEffect(() => {
    clearFilters()
  }, [activeTab, clearFilters])

  return {
    searchFilters,
    showFilters,
    setShowFilters,
    availableCategories,
    hasActiveFilters,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    applyFilters
  }
}
