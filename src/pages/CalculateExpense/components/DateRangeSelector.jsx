import React from 'react'

/**
 * Componente selector de rango de fechas
 */
const DateRangeSelector = ({ startDate, endDate, onStartDateChange, onEndDateChange, onCalculate }) => {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📅 Selecciona el Rango de Fechas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Final
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <button
        onClick={onCalculate}
        className="gradient-button text-white px-6 py-3 rounded-xl font-medium hover:scale-105 transition-transform"
      >
        🧮 Calcular Gastos
      </button>
    </div>
  )
}

export default DateRangeSelector
