import { useState, useEffect } from 'react'
import { formatDateLocal, getTodayLocal } from '../../../utils/normalizers'

/**
 * Hook para manejar el rango de fechas
 */
export const useDateRange = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Establecer fechas por defecto (último mes)
  useEffect(() => {
    const today = getTodayLocal()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), 12, 0, 0)
    
    setEndDate(formatDateLocal(today))
    setStartDate(formatDateLocal(lastMonth))
  }, [])

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate
  }
}
