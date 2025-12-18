import { useState, useMemo, useCallback } from 'react'

/**
 * Hook reutilizable para filtrar datos por año
 * @param {Array} data - Array de datos con campo 'fecha'
 * @returns {Object} - Estado y funciones para filtrar por año
 */
export const useYearFilter = (data = []) => {
  const currentYear = new Date().getFullYear()
  
  // Estado del filtro: 'current' (año actual), 'previous' (años anteriores), 'all' (todos)
  const [yearFilter, setYearFilter] = useState('all')
  // Año específico seleccionado (para cuando se elige un año anterior específico)
  const [selectedYear, setSelectedYear] = useState(null)

  // Obtener todos los años disponibles en los datos
  const availableYears = useMemo(() => {
    if (!data || data.length === 0) return [currentYear]
    
    const years = new Set()
    data.forEach(item => {
      if (item.fecha) {
        const year = new Date(item.fecha).getFullYear()
        if (!isNaN(year)) years.add(year)
      }
    })
    
    // Si no hay años, agregar el actual
    if (years.size === 0) years.add(currentYear)
    
    // Ordenar de más reciente a más antiguo
    return Array.from(years).sort((a, b) => b - a)
  }, [data, currentYear])

  // Años anteriores al actual
  const previousYears = useMemo(() => {
    return availableYears.filter(year => year < currentYear)
  }, [availableYears, currentYear])

  // Filtrar datos según el filtro seleccionado
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.filter(item => {
      if (!item.fecha) return yearFilter === 'all'
      
      const itemYear = new Date(item.fecha).getFullYear()
      
      switch (yearFilter) {
        case 'current':
          return itemYear === currentYear
        case 'previous':
          if (selectedYear) {
            return itemYear === selectedYear
          }
          return itemYear < currentYear
        case 'all':
        default:
          return true
      }
    })
  }, [data, yearFilter, selectedYear, currentYear])

  // Calcular estadísticas por año
  const statsByYear = useMemo(() => {
    if (!data || data.length === 0) return {}
    
    const stats = {}
    
    data.forEach(item => {
      if (!item.fecha) return
      
      const year = new Date(item.fecha).getFullYear()
      if (!stats[year]) {
        stats[year] = {
          count: 0,
          total: 0,
          gastos: 0,
          ingresos: 0
        }
      }
      
      stats[year].count++
      const monto = parseFloat(item.monto) || 0
      stats[year].total += monto
      
      if (item.es_entrada) {
        stats[year].ingresos += monto
      } else {
        stats[year].gastos += monto
      }
    })
    
    return stats
  }, [data])

  // Cambiar filtro
  const handleYearFilterChange = useCallback((filter, year = null) => {
    setYearFilter(filter)
    setSelectedYear(year)
  }, [])

  // Obtener el label del filtro actual
  const filterLabel = useMemo(() => {
    switch (yearFilter) {
      case 'current':
        return `${currentYear}`
      case 'previous':
        if (selectedYear) return `${selectedYear}`
        return 'Años anteriores'
      case 'all':
      default:
        return 'Todos'
    }
  }, [yearFilter, selectedYear, currentYear])

  return {
    // Estado
    yearFilter,
    selectedYear,
    currentYear,
    availableYears,
    previousYears,
    filterLabel,
    
    // Datos filtrados
    filteredData,
    statsByYear,
    
    // Funciones
    handleYearFilterChange,
    setYearFilter,
    setSelectedYear
  }
}

export default useYearFilter
