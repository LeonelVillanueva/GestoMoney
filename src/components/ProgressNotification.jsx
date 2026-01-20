import React, { useState, useEffect } from 'react'

const ProgressNotification = ({ 
  isVisible, 
  onClose, 
  expenseData, 
  totalsData, 
  duration = 5000 
}) => {
  const [progress, setProgress] = useState(0)
  const [animatedAmount, setAnimatedAmount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  // Detectar si es móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

      // Auto cerrar solo en móvil
      let closeTimeout = null
      if (isMobile) {
        closeTimeout = setTimeout(() => {
          onClose()
        }, duration)
      }

      return () => {
        clearInterval(progressInterval)
        clearInterval(amountInterval)
        if (closeTimeout) {
          clearTimeout(closeTimeout)
        }
      }
    }
  }, [isVisible, expenseData, duration, onClose, isMobile])

  if (!isVisible) return null

  const formatCurrency = (amount) => {
    const value = parseFloat(amount) || 0
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(value)
  }

  const isIngreso = expenseData?.es_entrada || false
  const totals = totalsData || {}

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

  // Versión móvil simplificada
  if (isMobile) {
    return (
      <div className="fixed top-4 right-4 left-4 z-50 transform transition-all duration-300 ease-in-out md:hidden">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{isIngreso ? '💰' : '💸'}</span>
              <h3 className="font-bold text-gray-800 text-sm">{isIngreso ? 'Ingreso Agregado' : 'Gasto Agregado'}</h3>
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

          {/* Información del gasto - Móvil simplificado */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">{getCategoryIcon(expenseData.category)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{expenseData.category}</p>
                <p className="text-xs text-gray-600 truncate">{expenseData.description}</p>
              </div>
            </div>

            {/* Monto agregado */}
            <div className={`border rounded-lg p-2.5 ${isIngreso ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isIngreso ? 'text-blue-800' : 'text-green-800'}`}>
                  {isIngreso ? 'Ingreso:' : 'Gasto:'}
                </span>
                <span className={`text-base font-bold ${isIngreso ? 'text-blue-600' : 'text-green-600'}`}>
                  {formatCurrency(animatedAmount)}
                </span>
              </div>
            </div>

            {/* Totales simplificados - Móvil */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">💸 Gastos:</span>
                <span className="font-bold text-red-600">{formatCurrency(totals.totalGastosNuevo || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">💰 Ingresos:</span>
                <span className="font-bold text-green-600">{formatCurrency(totals.totalIngresosNuevo || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm bg-gray-50 rounded p-2 border border-gray-200">
                <span className="text-gray-700 font-semibold">Total Neto:</span>
                <span className={`font-bold ${(totals.totalNetoNuevo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.totalNetoNuevo || 0)}
                </span>
              </div>
            </div>

            {/* Barra de progreso - Móvil */}
            <div className="space-y-1 pt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Mensaje de estado - Móvil */}
            <div className="text-center pt-1">
              {isAnimating ? (
                <p className="text-xs text-blue-600 font-medium animate-pulse">
                  Actualizando...
                </p>
              ) : (
                <p className="text-xs text-green-600 font-medium">
                  ✅ Actualizado
                </p>
              )}
            </div>
          </div>
        </div>

        <style>{`
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
          
          .animate-slide-in {
            animation: slideIn 0.3s ease-out;
          }
        `}</style>
      </div>
    )
  }

  // Versión PC detallada
  return (
    <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out hidden md:block">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm w-80 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{isIngreso ? '💰' : '💸'}</span>
            <h3 className="font-bold text-gray-800">{isIngreso ? 'Ingreso Agregado' : 'Gasto Agregado'}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-1.5 transition-all"
            title="Cerrar"
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
          <div className={`border rounded-lg p-3 ${isIngreso ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isIngreso ? 'text-blue-800' : 'text-green-800'}`}>
                {isIngreso ? 'Ingreso agregado:' : 'Gasto agregado:'}
              </span>
              <span className={`text-lg font-bold ${isIngreso ? 'text-blue-600' : 'text-green-600'}`}>
                {formatCurrency(animatedAmount)}
              </span>
            </div>
          </div>

          {/* Desglose de Totales */}
          <div className="space-y-3 border-t pt-3">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desglose Anterior</h4>
              
              {/* Total de Gastos Anterior */}
              <div className="flex items-center justify-between text-sm bg-red-50 rounded-lg p-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span>💸</span>
                  <span>Total Gastos:</span>
                </span>
                <span className="font-bold text-red-600">
                  {formatCurrency(totals.totalGastosAnterior || 0)}
                </span>
              </div>

              {/* Total de Ingresos Anterior */}
              <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg p-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span>💰</span>
                  <span>Total Ingresos:</span>
                </span>
                <span className="font-bold text-green-600">
                  {formatCurrency(totals.totalIngresosAnterior || 0)}
                </span>
              </div>

              {/* Total Neto Anterior */}
              <div className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2 border border-gray-200">
                <span className="text-gray-700 font-medium">Total Neto:</span>
                <span className={`font-bold ${(totals.totalNetoAnterior || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.totalNetoAnterior || 0)}
                </span>
              </div>
            </div>

            {/* Separador */}
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs text-gray-400">→</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Desglose Nuevo</h4>
              
              {/* Total de Gastos Nuevo */}
              <div className="flex items-center justify-between text-sm bg-red-50 rounded-lg p-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span>💸</span>
                  <span>Total Gastos:</span>
                </span>
                <span className="font-bold text-red-600">
                  {formatCurrency(totals.totalGastosNuevo || 0)}
                </span>
              </div>

              {/* Total de Ingresos Nuevo */}
              <div className="flex items-center justify-between text-sm bg-green-50 rounded-lg p-2">
                <span className="text-gray-700 flex items-center gap-2">
                  <span>💰</span>
                  <span>Total Ingresos:</span>
                </span>
                <span className="font-bold text-green-600">
                  {formatCurrency(totals.totalIngresosNuevo || 0)}
                </span>
              </div>

              {/* Total Neto Nuevo */}
              <div className="flex items-center justify-between text-sm bg-blue-50 rounded-lg p-2 border-2 border-blue-300">
                <span className="text-gray-800 font-semibold">Total Neto:</span>
                <span className={`font-bold text-lg ${(totals.totalNetoNuevo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.totalNetoNuevo || 0)}
                </span>
              </div>
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
          <div className="text-center pt-2">
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

          {/* Botón de cerrar visible en PC */}
          <div className="mt-4 pt-3 border-t">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Cerrar
            </button>
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
