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

      const closeTimeout = setTimeout(() => {
        onClose()
      }, duration)

      return () => {
        clearInterval(progressInterval)
        clearInterval(amountInterval)
        clearTimeout(closeTimeout)
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
      <div
        className="fixed top-4 right-4 left-4 z-[250] transform transition-all duration-300 ease-in-out md:hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 border border-zinc-700/80 p-4 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{isIngreso ? '💰' : '💸'}</span>
              <h3 className="font-bold text-zinc-100 text-sm">{isIngreso ? 'Ingreso Agregado' : 'Gasto Agregado'}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
              aria-label="Cerrar notificación"
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
                <p className="font-medium text-zinc-100 text-sm truncate">{expenseData.category}</p>
                <p className="text-xs text-zinc-400 truncate">{expenseData.description}</p>
              </div>
            </div>

            {/* Monto agregado */}
            <div className={`border rounded-lg p-2.5 ${
              isIngreso
                ? 'bg-sky-500/10 border-sky-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${isIngreso ? 'text-sky-300' : 'text-emerald-300'}`}>
                  {isIngreso ? 'Ingreso:' : 'Gasto:'}
                </span>
                <span className={`text-base font-bold ${isIngreso ? 'text-sky-200' : 'text-emerald-200'}`}>
                  {formatCurrency(animatedAmount)}
                </span>
              </div>
            </div>

            {/* Totales simplificados - Móvil */}
            <div className="space-y-2 pt-2 border-t border-zinc-700/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">💸 Gastos:</span>
                <span className="font-bold text-red-400">{formatCurrency(totals.totalGastosNuevo || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">💰 Ingresos:</span>
                <span className="font-bold text-emerald-400">{formatCurrency(totals.totalIngresosNuevo || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm bg-zinc-800/60 rounded p-2 border border-zinc-700/80">
                <span className="text-zinc-200 font-semibold">Total neto</span>
                <span className={`font-bold ${(totals.totalNetoNuevo || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(totals.totalNetoNuevo || 0)}
                </span>
              </div>
            </div>

            {/* Barra de progreso - Móvil */}
            <div className="space-y-1 pt-2">
              <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Mensaje de estado - Móvil */}
            <div className="text-center pt-1">
              {isAnimating ? (
                <p className="text-xs text-sky-400 font-medium animate-pulse">
                  Actualizando…
                </p>
              ) : (
                <p className="text-xs text-emerald-400 font-medium">
                  Actualizado
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
    <div
      className="fixed top-4 right-4 z-[250] transform transition-all duration-300 ease-in-out hidden md:block"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-2xl shadow-black/40 border border-zinc-700/80 p-6 max-w-sm w-80 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{isIngreso ? '💰' : '💸'}</span>
            <h3 className="font-bold text-zinc-100">{isIngreso ? 'Ingreso agregado' : 'Gasto agregado'}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-lg p-1.5 transition-all"
            title="Cerrar"
            aria-label="Cerrar notificación"
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
              <p className="font-medium text-zinc-100">{expenseData.category}</p>
              <p className="text-sm text-zinc-400">{expenseData.description}</p>
            </div>
          </div>

          {/* Monto agregado con animación */}
          <div
            className={`border rounded-lg p-3 ${
              isIngreso
                ? 'bg-sky-500/10 border-sky-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${isIngreso ? 'text-sky-300' : 'text-emerald-300'}`}>
                {isIngreso ? 'Ingreso agregado' : 'Gasto agregado'}
              </span>
              <span className={`text-lg font-bold ${isIngreso ? 'text-sky-200' : 'text-emerald-200'}`}>
                {formatCurrency(animatedAmount)}
              </span>
            </div>
          </div>

          {/* Desglose de Totales */}
          <div className="space-y-3 border-t border-zinc-700/80 pt-3">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Desglose anterior</h4>
              
              <div className="flex items-center justify-between text-sm bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span>💸</span>
                  <span>Total gastos</span>
                </span>
                <span className="font-bold text-red-400">
                  {formatCurrency(totals.totalGastosAnterior || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span>💰</span>
                  <span>Total ingresos</span>
                </span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(totals.totalIngresosAnterior || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm bg-zinc-800/60 rounded-lg p-2 border border-zinc-700/80">
                <span className="text-zinc-200 font-medium">Total neto</span>
                <span className={`font-bold ${(totals.totalNetoAnterior || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(totals.totalNetoAnterior || 0)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-zinc-700" />
              <span className="text-xs text-zinc-500">→</span>
              <div className="flex-1 h-px bg-zinc-700" />
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Desglose nuevo</h4>
              
              <div className="flex items-center justify-between text-sm bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span>💸</span>
                  <span>Total gastos</span>
                </span>
                <span className="font-bold text-red-400">
                  {formatCurrency(totals.totalGastosNuevo || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                <span className="text-zinc-300 flex items-center gap-2">
                  <span>💰</span>
                  <span>Total ingresos</span>
                </span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(totals.totalIngresosNuevo || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm bg-sky-500/10 rounded-lg p-2 border border-sky-500/30">
                <span className="text-zinc-200 font-semibold">Total neto</span>
                <span className={`font-bold text-lg ${(totals.totalNetoNuevo || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(totals.totalNetoNuevo || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              >
                {/* Efecto de brillo animado */}
                <div 
                  className="h-full bg-zinc-900 opacity-30 rounded-full transform -skew-x-12 animate-shimmer"
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
              <p className="text-sm text-sky-400 font-medium animate-pulse">
                Actualizando total…
              </p>
            ) : (
              <p className="text-sm text-emerald-400 font-medium">
                Total actualizado
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-700/80">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg border border-zinc-600 bg-zinc-800/60 text-zinc-200 font-medium text-sm hover:bg-zinc-800 transition-colors"
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
