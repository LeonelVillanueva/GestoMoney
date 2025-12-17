import React, { useState, useEffect, useCallback } from 'react'

const DateInput = ({ value, onChange, label, required = false, className = "" }) => {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Meses en español
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' }
  ]

  // Generar días del mes (1-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))

  // Generar años (año actual y 5 años hacia atrás)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - i).toString())

  // Función para validar y ajustar fecha si hay diferencia de un día
  const validateAndAdjustDate = useCallback((inputDay, inputMonth, inputYear) => {
    if (!inputDay || !inputMonth || !inputYear) return

    // Crear fecha original ingresada
    const originalDate = new Date(inputYear, inputMonth - 1, inputDay)
    
    // Crear fecha con zona horaria UTC-6
    const utcDate = new Date(`${inputYear}-${inputMonth}-${inputDay}T12:00:00-06:00`)
    
    // Obtener componentes de la fecha UTC
    const utcDay = utcDate.getUTCDate()
    const utcMonth = utcDate.getUTCMonth() + 1
    const utcYear = utcDate.getUTCFullYear()
    
    
    // Verificar si hay diferencia de un día
    const dayDifference = parseInt(inputDay) - utcDay
    const monthDifference = parseInt(inputMonth) - utcMonth
    const yearDifference = parseInt(inputYear) - utcYear
    
    let adjustedDay = inputDay
    let adjustedMonth = inputMonth
    let adjustedYear = inputYear
    
    // Ajustar si hay diferencia de un día
    if (dayDifference === 1 && monthDifference === 0 && yearDifference === 0) {
      // La fecha UTC es un día menos, ajustar sumando un día
      adjustedDay = (parseInt(inputDay) + 1).toString().padStart(2, '0')
    } else if (dayDifference === -1 && monthDifference === 0 && yearDifference === 0) {
      // La fecha UTC es un día más, ajustar restando un día
      adjustedDay = (parseInt(inputDay) - 1).toString().padStart(2, '0')
    }
    
    // Crear fecha final ajustada
    const finalDateString = `${adjustedYear}-${adjustedMonth}-${adjustedDay}`
    
    
    onChange(finalDateString)
  }, [onChange])

  // Función para actualizar la fecha sin causar loops
  const updateDate = useCallback((newDay, newMonth, newYear) => {
    if (newDay && newMonth && newYear) {
      // Usar la función de validación y ajuste
      validateAndAdjustDate(newDay, newMonth, newYear)
    }
  }, [validateAndAdjustDate])

  // Función para parsear fecha de manera simple
  const parseDateSafely = (dateString) => {
    if (!dateString) return null
    
    // Si es formato YYYY-MM-DD, parsear directamente
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      return { year, month, day }
    }
    
    // Para otros formatos, usar parsing básico
    const date = new Date(dateString)
    const newDay = date.getDate().toString().padStart(2, '0')
    const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
    const newYear = date.getFullYear().toString()
    
    return { year: newYear, month: newMonth, day: newDay }
  }

  // Inicializar solo una vez al montar el componente
  useEffect(() => {
    if (!isInitialized) {
      if (value) {
        const parsedDate = parseDateSafely(value)
        if (parsedDate) {
          setDay(parsedDate.day)
          setMonth(parsedDate.month)
          setYear(parsedDate.year)
          // NO llamar onChange cuando se inicializa con un valor existente
        }
      } else {
        // Usar fecha actual en zona horaria UTC-6 (Honduras) solo si no hay valor inicial
        const now = new Date()
        // Crear fecha en UTC-6 para Honduras
        const hondurasDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Tegucigalpa"}))
        
        const newDay = hondurasDate.getDate().toString().padStart(2, '0')
        const newMonth = (hondurasDate.getMonth() + 1).toString().padStart(2, '0')
        const newYear = hondurasDate.getFullYear().toString()
        
        setDay(newDay)
        setMonth(newMonth)
        setYear(newYear)
        
        // Llamar onChange para establecer la fecha inicial
        updateDate(newDay, newMonth, newYear)
      }
      setIsInitialized(true)
    }
  }, [isInitialized, updateDate]) // ✅ Remover 'value' de las dependencias para evitar bucle

  // Actualizar cuando cambie el valor externamente (solo si ya está inicializado)
  useEffect(() => {
    if (isInitialized && value) {
      const parsedDate = parseDateSafely(value)
      if (parsedDate) {
        setDay(parsedDate.day)
        setMonth(parsedDate.month)
        setYear(parsedDate.year)
        // NO llamar onChange aquí para evitar bucles
      }
    }
  }, [value, isInitialized]) // ✅ Dependencias más simples

  // Manejar cambios en los campos individuales
  const handleDayChange = (newDay) => {
    setDay(newDay)
    updateDate(newDay, month, year)
  }

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth)
    updateDate(day, newMonth, year)
  }

  const handleYearChange = (newYear) => {
    setYear(newYear)
    updateDate(day, month, newYear)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Día */}
        <div>
          <select
            value={day}
            onChange={(e) => handleDayChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">Día</option>
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Mes */}
        <div>
          <select
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">Mes</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Año */}
        <div>
          <select
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          >
            <option value="">Año</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default DateInput
