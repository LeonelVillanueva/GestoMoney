import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const CustomDatePicker = ({ 
  id,
  buttonId,
  buttonRef,
  value, 
  onChange, 
  placeholder = "Seleccionar fecha",
  type = "date", // "date" o "month"
  className = "",
  disabled = false,
  'aria-invalid': ariaInvalid = false,
  'aria-describedby': ariaDescribedBy
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(value || '')
  const [displayDate, setDisplayDate] = useState(value || '')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    setSelectedDate(value || '')
    setDisplayDate(value || '')
  }, [value])

  // Calcular la posición del dropdown cuando se abre
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 400 // Altura aproximada del dropdown
      
      // Determinar si hay espacio abajo o debe abrirse arriba
      const spaceBelow = viewportHeight - rect.bottom
      const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight
      
      setDropdownPosition({
        top: openAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        openAbove
      })
    }
  }, [isOpen])

  // Actualizar posición en scroll/resize
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const dropdownHeight = 400
        
        const spaceBelow = viewportHeight - rect.bottom
        const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight
        
        setDropdownPosition({
          top: openAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
          left: rect.left,
          width: rect.width,
          openAbove
        })
      }
    }

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target)
      const isClickInsideTrigger = triggerRef.current && triggerRef.current.contains(event.target)
      
      if (!isClickInsideDropdown && !isClickInsideTrigger) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [])

  // Función para parsear fecha sin problemas de zona horaria
  const parseDateSafe = (dateString) => {
    if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return null
    const [year, month, day] = dateString.split('-')
    // Crear fecha en hora local (mediodía) para evitar problemas de zona horaria
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
  }

  const formatDisplayValue = (dateString) => {
    if (!dateString) return placeholder
    
    if (type === 'month') {
      const [year, month] = dateString.split('-')
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ]
      return `${monthNames[parseInt(month) - 1]} ${year}`
    } else {
      // Parsear fecha sin problemas de zona horaria
      const date = parseDateSafe(dateString)
      if (!date) return placeholder
      
      return date.toLocaleDateString('es-HN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const handleDateSelect = (dateValue) => {
    setSelectedDate(dateValue)
    setDisplayDate(dateValue)
    setIsOpen(false)
    onChange(dateValue)
  }

  const handleInputChange = (e) => {
    const inputValue = e.target.value
    setSelectedDate(inputValue)
    setDisplayDate(inputValue)
    onChange(inputValue)
  }

  const clearDate = () => {
    setSelectedDate('')
    setDisplayDate('')
    onChange('')
    setIsOpen(false)
  }

  const getCurrentDate = () => {
    const now = new Date()
    if (type === 'month') {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    } else {
      // Formatear fecha actual sin problemas de zona horaria
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  const getCurrentYear = () => new Date().getFullYear()

  const renderMonthPicker = () => {
    const currentYear = getCurrentYear()
    const years = Array.from({length: 5}, (_, i) => currentYear - i)
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    return (
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {years.map(year => (
            <button
              key={year}
              onClick={() => {
                const currentMonth = selectedDate ? selectedDate.split('-')[1] : String(new Date().getMonth() + 1).padStart(2, '0')
                handleDateSelect(`${year}-${currentMonth}`)
              }}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedDate && selectedDate.split('-')[0] === year.toString()
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800/60 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-zinc-300 dark:text-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {months.map((month, index) => {
            const monthValue = `${currentYear}-${String(index + 1).padStart(2, '0')}`
            return (
              <button
                key={index}
                onClick={() => handleDateSelect(monthValue)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedDate === monthValue
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800/60 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-zinc-300 dark:text-gray-200'
                }`}
              >
                {month.substring(0, 3)}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDatePicker = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    const [selectedYear, selectedMonth] = selectedDate 
      ? selectedDate.split('-').map(Number)
      : [currentYear, currentMonth + 1]

    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
    const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay()

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

    const generateDays = () => {
      const daysArray = []
      
      // Días vacíos al inicio
      for (let i = 0; i < startingDayOfWeek; i++) {
        daysArray.push(<div key={`empty-${i}`} className="h-8"></div>)
      }
      
      // Días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const dayValue = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isSelected = selectedDate === dayValue
        const isToday = today.toISOString().split('T')[0] === dayValue
        
        daysArray.push(
          <button
            key={day}
            onClick={() => handleDateSelect(dayValue)}
            className={`h-8 w-8 text-sm rounded-lg transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : isToday
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold'
                : 'hover:bg-zinc-800/60 dark:hover:bg-slate-600 text-zinc-300 dark:text-gray-200'
            }`}
          >
            {day}
          </button>
        )
      }
      
      return daysArray
    }

    const changeMonth = (direction) => {
      const newDate = new Date(selectedYear, selectedMonth - 1 + direction, 1)
      const newYear = newDate.getFullYear()
      const newMonth = newDate.getMonth() + 1
      
      // Mantener el día seleccionado si existe
      const selectedDay = selectedDate ? selectedDate.split('-')[2] : '01'
      const newMonthDays = new Date(newYear, newMonth, 0).getDate()
      const dayToUse = Math.min(parseInt(selectedDay), newMonthDays)
      
      const newDateValue = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`
      setSelectedDate(newDateValue)
      setDisplayDate(newDateValue)
      onChange(newDateValue)
    }

    return (
      <div className="p-4">
        {/* Header del calendario */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-zinc-800/60 dark:hover:bg-slate-600 rounded-lg transition-colors text-zinc-300 dark:text-gray-200"
          >
            ←
          </button>
          <h3 className="font-semibold text-zinc-100 dark:text-gray-100">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </h3>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-zinc-800/60 dark:hover:bg-slate-600 rounded-lg transition-colors text-zinc-300 dark:text-gray-200"
          >
            →
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1">
          {generateDays()}
        </div>
      </div>
    )
  }

  // Renderizar el dropdown usando un portal para evitar problemas de z-index
  const renderDropdown = () => {
    if (!isOpen || disabled) return null

    return createPortal(
      <div 
        ref={dropdownRef}
        id={id ? `${id}-dialog` : undefined}
        role="dialog"
        aria-modal="false"
        aria-label={type === 'month' ? 'Selector de mes' : 'Selector de fecha'}
        className="bg-white dark:bg-slate-800 border border-zinc-700 dark:border-slate-600 rounded-xl shadow-2xl"
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${Math.max(dropdownPosition.width, 280)}px`,
          zIndex: 99999,
          maxHeight: '400px'
        }}
      >
        <div className="max-h-80 overflow-auto">
              {type === 'month' ? renderMonthPicker() : renderDatePicker()}
        </div>
        
        {/* Footer con botones */}
        <div className="border-t border-zinc-700 dark:border-slate-600 p-3 flex justify-between">
          <button
            onClick={() => handleDateSelect(getCurrentDate())}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 text-sm text-zinc-400 dark:text-gray-400 hover:text-zinc-300 dark:hover:text-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        id={buttonId}
        ref={(el) => {
          triggerRef.current = el
          if (buttonRef && typeof buttonRef === 'object') {
            buttonRef.current = el
          }
        }}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !disabled) {
            e.preventDefault()
            setIsOpen(true)
          }
          if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={id ? `${id}-dialog` : undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        className={`
          w-full px-3 py-2.5 border border-zinc-600 dark:border-slate-600 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-all cursor-pointer flex items-center justify-between
          ${disabled ? 'bg-zinc-800/60 dark:bg-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-700 hover:border-gray-400 dark:hover:border-slate-500'}
        `}
      >
        <span className={`${selectedDate ? 'text-zinc-100 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
          {formatDisplayValue(displayDate)}
        </span>
        <span className="text-gray-400">📅</span>
      </button>

      {selectedDate && !disabled && (
        <button
          type="button"
          onClick={clearDate}
          className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-zinc-300 transition-colors"
          aria-label="Limpiar fecha"
        >
          ✕
        </button>
      )}

      {/* Input nativo oculto para compatibilidad */}
      <input
        id={id}
        type={type}
        value={selectedDate}
        onChange={handleInputChange}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />

      {/* Dropdown del calendario (renderizado en portal) */}
      {renderDropdown()}
    </div>
  )
}

export default CustomDatePicker
