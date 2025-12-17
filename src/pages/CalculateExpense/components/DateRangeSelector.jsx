import React from 'react'

/**
 * Componente selector de rango de fechas
 */
const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, onCalculate }) => {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fecha Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <button
          onClick={onCalculate}
          className="gradient-button text-white px-5 py-2 rounded-lg font-medium hover:scale-105 transition-transform text-sm whitespace-nowrap"
        >
          🧮 Calcular
        </button>
      </div>
    </div>
  )
}

export default DateRangeSelector
