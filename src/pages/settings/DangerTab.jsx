import React from 'react'

export default function DangerTab({ onClearData }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">⚠️ Zona de Peligro</h3>
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-1">Eliminar Todos los Datos</h4>
              <p className="text-xs text-red-700 dark:text-red-400 mb-3">Esta acción eliminará permanentemente todos tus datos incluyendo gastos, categorías y configuraciones.</p>
              <button 
                onClick={onClearData} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🗑️ Eliminar Todos los Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






