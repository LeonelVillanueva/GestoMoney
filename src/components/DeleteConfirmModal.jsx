import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import useSecurityPin from '../hooks/useSecurityPin'

/**
 * Modal de confirmación con PIN de seguridad
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onConfirm - Función a ejecutar si el PIN es correcto
 * @param {string} props.title - Título del modal
 * @param {string} props.message - Mensaje descriptivo
 * @param {string} props.itemName - Nombre del item (opcional)
 * @param {boolean} props.isDangerous - Si es una acción muy peligrosa (eliminar todo)
 * @param {string} props.actionType - Tipo de acción: 'delete' o 'edit'
 */
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar eliminación?',
  message = 'Esta acción no se puede deshacer.',
  itemName = '',
  isDangerous = false,
  actionType = 'delete' // 'delete' o 'edit'
}) => {
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [showSetupPrompt, setShowSetupPrompt] = useState(false)
  const inputRefs = useRef([])
  
  const { hasPin, loading, verifyPin } = useSecurityPin()

  // Resetear estado cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setPin(['', '', '', '', '', ''])
      setError('')
      setIsVerifying(false)
      // Enfocar primer input después de un pequeño delay
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus()
        }
      }, 100)
    }
  }, [isOpen])

  // Verificar si hay PIN configurado
  useEffect(() => {
    if (isOpen && !loading && !hasPin) {
      setShowSetupPrompt(true)
    } else {
      setShowSetupPrompt(false)
    }
  }, [isOpen, loading, hasPin])

  const handleInputChange = (index, value) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError('')

    // Mover al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Auto-verificar cuando el PIN esté completo
  useEffect(() => {
    const fullPin = pin.join('')
    if (fullPin.length === 6 && !isVerifying && !error && isOpen) {
      // Pequeño delay para permitir que el usuario vea el último dígito
      const timer = setTimeout(() => {
        handleVerify()
      }, 300)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin.join(''), isVerifying, error, isOpen]) // Usar pin.join('') como dependencia

  const handleKeyDown = (index, e) => {
    // Backspace: borrar y mover al anterior
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Enter: intentar verificar
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newPin = pastedData.split('')
      setPin(newPin)
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullPin = pin.join('')
    
    if (fullPin.length !== 6) {
      setError('Ingresa los 6 dígitos del PIN')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyPin(fullPin)
      
      if (result.valid) {
        onConfirm()
        onClose()
      } else {
        setError(result.error || 'PIN incorrecto')
        setPin(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Error al verificar el PIN')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCancel = () => {
    setPin(['', '', '', '', '', ''])
    setError('')
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all ${
          isDangerous ? 'border-2 border-red-500' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 rounded-t-2xl ${isDangerous ? 'bg-red-50 dark:bg-red-900/30' : actionType === 'edit' ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-zinc-800/50 dark:bg-slate-700'}`}>
          <div className="flex items-center gap-3">
            <div className={`text-3xl ${isDangerous ? 'animate-pulse' : ''}`}>
              {isDangerous ? '⚠️' : actionType === 'edit' ? '✏️' : '🔐'}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDangerous ? 'text-red-700 dark:text-red-300' : 'text-zinc-100 dark:text-slate-200'}`}>
                {title}
              </h3>
              {itemName && (
                <p className="text-sm text-zinc-400 dark:text-zinc-400 mt-1">
                  {itemName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : showSetupPrompt ? (
            // Si no hay PIN configurado, bloquear acción sensible
            <div className="text-center py-4">
              <div className="text-4xl mb-3">🔓</div>
              <p className="text-zinc-400 dark:text-zinc-400 mb-4">
                No tienes un PIN de seguridad configurado.
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                Para editar o eliminar registros debes configurar tu PIN en Ajustes → Seguridad.
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-zinc-400 dark:text-gray-400 hover:bg-zinc-800/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-zinc-400 dark:text-zinc-400 text-center mb-6">
                {message}
              </p>

              {/* PIN Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 dark:text-slate-300 text-center mb-3">
                  Ingresa tu PIN de seguridad
                </label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all
                        ${error 
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                          : 'border-zinc-600 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400'
                        }
                        bg-zinc-900 dark:bg-slate-700 text-zinc-100 dark:text-slate-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      disabled={isVerifying}
                    />
                  ))}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="text-center mb-4">
                  <p className="text-red-500 text-sm font-medium animate-shake">
                    ❌ {error}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  disabled={isVerifying}
                  className="flex-1 px-4 py-3 text-zinc-300 dark:text-gray-300 bg-zinc-800/60 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || pin.some(d => !d)}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                    isDangerous
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Verificando...
                    </>
                  ) : (
                    <>
                      {actionType === 'edit' ? '✏️ Editar' : '🗑️ Confirmar'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default DeleteConfirmModal
