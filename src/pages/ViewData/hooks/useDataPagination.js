import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * Hook personalizado para gestionar la paginación de datos
 */
export const useDataPagination = (filteredData, itemsPerPage = 25) => {
  const [currentPage, setCurrentPage] = useState(1)

  // Memoizar datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredData.slice(startIndex, endIndex)
  }, [filteredData, currentPage, itemsPerPage])

  // Memoizar total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredData.length / itemsPerPage)
  }, [filteredData.length, itemsPerPage])

  // Cambiar página
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  // Resetear página cuando cambien los datos filtrados
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length])

  return {
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    setCurrentPage
  }
}
