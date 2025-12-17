import React, { useState, useEffect } from 'react'

const ProgressNotification = ({ 
  isVisible, 
  onClose, 
  expenseData, 
  currentTotal, 
  newTotal, 
  duration = 5000 
}) => {
  const [progress, setProgress] = useState(0)
  const [animatedAmount, setAnimatedAmount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible && expenseData) {
      setIsAnimating(true)
      setProgress(0)
      setAnimatedAmount(0)
      
      // Animar el progreso de 0 a 100%
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            setIsAnimating(false)
            return 100
          }
          return prev + 2
        })
      }, duration / 50)

      // Animar el monto agregado
      const amountInterval = setInterval(() => {
        setAnimatedAmount(prev => {
          if (prev >= expenseData.amount) {
            clearInterval(amountInterval)
            return expenseData.amount
          }
          return prev + (expenseData.amount / 50)
        })
      }, duration / 50)

      // Auto cerrar después de la duración
      const closeTimeout = setTimeout(() => {
        onClose()
      }, duration)

      return () => {
        clearInterval(progressInterval)
        clearInterval(amountInterval)
        clearTimeout(closeTimeout)
      }
    }
  }, [isVisible, expenseData, duration, onClose])

  if (!isVisible) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Comida': '🍽️',
      'Transporte': '🚗',
      'Entretenimiento': '🎬',
      'Salud': '🏥',
      'Educación': '📚',
      'Ropa': '👕',
      'Hogar': '🏠',
      'Tecnología': '💻',
      'Otros': '📦'
    }
    return iconMap[category] || '📦'
  }

  return (
    <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm w-80 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💰</span>
            <h3 className="font-bold text-gray-800">Gasto Agregado</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Información del gasto */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCategoryIcon(expenseData.category)}</span>
            <div>
              <p className="font-medium text-gray-800">{expenseData.category}</p>
              <p className="text-sm text-gray-600">{expenseData.description}</p>
            </div>
          </div>

          {/* Monto agregado con animación */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Monto agregado:</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(animatedAmount)}
              </span>
            </div>
          </div>

          {/* Totales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total anterior:</span>
              <span className="font-medium">{formatCurrency(currentTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Nuevo total:</span>
              <span className="font-bold text-blue-600">{formatCurrency(newTotal)}</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              >
                {/* Efecto de brillo animado */}
                <div 
                  className="h-full bg-white opacity-30 rounded-full transform -skew-x-12 animate-shimmer"
                  style={{ 
                    width: '100%',
                    animation: isAnimating ? 'shimmer 1.5s infinite' : 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          <div className="text-center">
            {isAnimating ? (
              <p className="text-sm text-blue-600 font-medium animate-pulse">
                Actualizando total...
              </p>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                ✅ Total actualizado
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default ProgressNotification
