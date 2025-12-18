import React, { useState, useRef, useEffect } from 'react'
import useSecurityPin from '../../hooks/useSecurityPin'
import notifications from '../../utils/services/notifications'

export default function SecurityTab() {
  const { hasPin, loading, setPin, changePin, removePin, checkPinExists } = useSecurityPin()
  
  // Estados para configurar nuevo PIN
  const [newPin, setNewPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [currentPinForChange, setCurrentPinForChange] = useState(['', '', '', '', '', ''])
  const [currentPinForRemove, setCurrentPinForRemove] = useState(['', '', '', '', '', ''])
  
  const [mode, setMode] = useState('view') // 'view', 'setup', 'change', 'remove'
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const newPinRefs = useRef([])
  const confirmPinRefs = useRef([])
  const currentPinRefs = useRef([])
  const removePinRefs = useRef([])

  useEffect(() => {
    checkPinExists()
  }, [checkPinExists])

  const resetForm = () => {
    setNewPin(['', '', '', '', '', ''])
    setConfirmPin(['', '', '', '', '', ''])
    setCurrentPinForChange(['', '', '', '', '', ''])
    setCurrentPinForRemove(['', '', '', '', '', ''])
    setError('')
    setMode('view')
  }

  const handlePinInput = (value, index, pinArray, setPinArray, refs, nextRefs) => {
    if (value && !/^\d$/.test(value)) return
    
    const newArray = [...pinArray]
    newArray[index] = value
    setPinArray(newArray)
    setError('')

    if (value && index < 5) {
      refs.current[index + 1]?.focus()
    } else if (value && index === 5 && nextRefs) {
      // Si completamos este PIN, mover al siguiente campo
      nextRefs.current[0]?.focus()
    }
  }

  const handleKeyDown = (e, index, pinArray, setPinArray, refs) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e, setPinArray, refs) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setPinArray(pastedData.split(''))
      refs.current[5]?.focus()
    }
  }

  const handleSetupPin = async () => {
    const pin1 = newPin.join('')
    const pin2 = confirmPin.join('')

    if (pin1.length !== 6) {
      setError('Ingresa un PIN de 6 dígitos')
      return
    }

    if (pin1 !== pin2) {
      setError('Los PINs no coinciden')
      setConfirmPin(['', '', '', '', '', ''])
      confirmPinRefs.current[0]?.focus()
      return
    }

    setIsProcessing(true)
    const result = await setPin(pin1)
    setIsProcessing(false)

    if (result.success) {
      notifications.showSync('✅ PIN de seguridad configurado correctamente', 'success')
      resetForm()
      checkPinExists()
    } else {
      setError(result.error)
    }
  }

  const handleChangePin = async () => {
    const currentPin = currentPinForChange.join('')
    const pin1 = newPin.join('')
    const pin2 = confirmPin.join('')

    if (currentPin.length !== 6) {
      setError('Ingresa tu PIN actual')
      return
    }

    if (pin1.length !== 6) {
      setError('Ingresa el nuevo PIN de 6 dígitos')
      return
    }

    if (pin1 !== pin2) {
      setError('Los nuevos PINs no coinciden')
      setConfirmPin(['', '', '', '', '', ''])
      confirmPinRefs.current[0]?.focus()
      return
    }

    if (currentPin === pin1) {
      setError('El nuevo PIN debe ser diferente al actual')
      return
    }

    setIsProcessing(true)
    const result = await changePin(currentPin, pin1)
    setIsProcessing(false)

    if (result.success) {
      notifications.showSync('✅ PIN cambiado correctamente', 'success')
      resetForm()
    } else {
      setError(result.error)
      if (result.error.includes('actual')) {
        setCurrentPinForChange(['', '', '', '', '', ''])
        currentPinRefs.current[0]?.focus()
      }
    }
  }

  const handleRemovePin = async () => {
    const pin = currentPinForRemove.join('')

    if (pin.length !== 6) {
      setError('Ingresa tu PIN actual para confirmar')
      return
    }

    setIsProcessing(true)
    const result = await removePin(pin)
    setIsProcessing(false)

    if (result.success) {
      notifications.showSync('🔓 PIN de seguridad eliminado', 'warning')
      resetForm()
      checkPinExists()
    } else {
      setError(result.error)
      setCurrentPinForRemove(['', '', '', '', '', ''])
      removePinRefs.current[0]?.focus()
    }
  }

  const renderPinInput = (pinArray, setPinArray, refs, nextRefs = null, disabled = false) => (
    <div 
      className="flex justify-center gap-2"
      onPaste={(e) => handlePaste(e, setPinArray, refs)}
    >
      {pinArray.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (refs.current[index] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinInput(e.target.value, index, pinArray, setPinArray, refs, nextRefs)}
          onKeyDown={(e) => handleKeyDown(e, index, pinArray, setPinArray, refs)}
          className="w-10 h-12 text-center text-xl font-bold border-2 rounded-lg transition-all
            border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400
            bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/20
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || isProcessing}
        />
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">🔐 PIN de Seguridad</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Configura un PIN de 6 dígitos para proteger las acciones de eliminación de datos.
        </p>
      </div>

      {/* Estado actual */}
      <div className={`p-4 rounded-lg border ${
        hasPin 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{hasPin ? '🔒' : '🔓'}</span>
          <div>
            <p className={`font-medium ${hasPin ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {hasPin ? 'PIN de seguridad activo' : 'Sin PIN de seguridad'}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {hasPin 
                ? 'Tus datos están protegidos. Se pedirá el PIN antes de eliminar.' 
                : 'Configura un PIN para proteger tus datos de eliminaciones accidentales.'}
            </p>
          </div>
        </div>
      </div>

      {/* Modo Vista - Botones de acción */}
      {mode === 'view' && (
        <div className="space-y-3">
          {!hasPin ? (
            <button
              onClick={() => {
                setMode('setup')
                setTimeout(() => newPinRefs.current[0]?.focus(), 100)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              🔐 Configurar PIN de Seguridad
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setMode('change')
                  setTimeout(() => currentPinRefs.current[0]?.focus(), 100)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                🔄 Cambiar PIN
              </button>
              <button
                onClick={() => {
                  setMode('remove')
                  setTimeout(() => removePinRefs.current[0]?.focus(), 100)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg font-medium transition-colors"
              >
                🗑️ Eliminar PIN
              </button>
            </>
          )}
        </div>
      )}

      {/* Modo Setup - Configurar nuevo PIN */}
      {mode === 'setup' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 text-center">
            Configura tu nuevo PIN de 6 dígitos
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 text-center mb-2">
                Nuevo PIN
              </label>
              {renderPinInput(newPin, setNewPin, newPinRefs, confirmPinRefs)}
            </div>
            
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 text-center mb-2">
                Confirmar PIN
              </label>
              {renderPinInput(confirmPin, setConfirmPin, confirmPinRefs)}
            </div>
          </div>

          {error && (
            <p className="text-center text-red-500 text-sm">❌ {error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSetupPin}
              disabled={isProcessing || newPin.some(d => !d) || confirmPin.some(d => !d)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                'Guardar PIN'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modo Change - Cambiar PIN */}
      {mode === 'change' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 text-center">
            Cambiar PIN de seguridad
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 text-center mb-2">
                PIN Actual
              </label>
              {renderPinInput(currentPinForChange, setCurrentPinForChange, currentPinRefs, newPinRefs)}
            </div>
            
            <hr className="border-gray-300 dark:border-slate-600" />
            
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 text-center mb-2">
                Nuevo PIN
              </label>
              {renderPinInput(newPin, setNewPin, newPinRefs, confirmPinRefs)}
            </div>
            
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 text-center mb-2">
                Confirmar Nuevo PIN
              </label>
              {renderPinInput(confirmPin, setConfirmPin, confirmPinRefs)}
            </div>
          </div>

          {error && (
            <p className="text-center text-red-500 text-sm">❌ {error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangePin}
              disabled={isProcessing || currentPinForChange.some(d => !d) || newPin.some(d => !d) || confirmPin.some(d => !d)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Cambiando...
                </>
              ) : (
                'Cambiar PIN'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modo Remove - Eliminar PIN */}
      {mode === 'remove' && (
        <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h4 className="text-sm font-medium text-red-700 dark:text-red-300 text-center">
            ⚠️ Eliminar PIN de seguridad
          </h4>
          
          <p className="text-xs text-red-600 dark:text-red-400 text-center">
            Esto deshabilitará la protección de eliminación. Cualquier persona con acceso podrá eliminar datos sin confirmación adicional.
          </p>
          
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 text-center mb-2">
              Ingresa tu PIN actual para confirmar
            </label>
            {renderPinInput(currentPinForRemove, setCurrentPinForRemove, removePinRefs)}
          </div>

          {error && (
            <p className="text-center text-red-500 text-sm">❌ {error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={resetForm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleRemovePin}
              disabled={isProcessing || currentPinForRemove.some(d => !d)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Eliminando...
                </>
              ) : (
                '🗑️ Eliminar PIN'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
          ℹ️ ¿Qué protege el PIN?
        </h4>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
          <li>• Eliminación de gastos individuales</li>
          <li>• Eliminación de compras de supermercado</li>
          <li>• Eliminación de cortes</li>
          <li>• Eliminación de categorías y configuraciones</li>
          <li>• Eliminación de presupuestos</li>
          <li>• Eliminación masiva de todos los datos</li>
        </ul>
      </div>
    </div>
  )
}
