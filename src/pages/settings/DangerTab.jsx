import React from 'react'

export default function DangerTab({ onClearData }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-red-600 mb-6">⚠️ Zona de Peligro</h3>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-bold text-red-800 mb-2">Eliminar Todos los Datos</h4>
                <p className="text-red-700 text-sm mb-4">Esta acción eliminará permanentemente todos tus datos incluyendo gastos, categorías y configuraciones.</p>
                <button onClick={onClearData} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">🗑️ Eliminar Todos los Datos</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}






