import React, { useState, useRef, useEffect } from 'react'
import useSecurityPin from '../../hooks/useSecurityPin'
import { useAuth } from '../../contexts/AuthContext'
import notifications from '../../utils/services/notifications'

export default function SecurityTab() {
  const { hasPin, loading, setPin, changePin, removePin, checkPinExists } = useSecurityPin()
  const { user, changePassword, changeEmail, verifyPassword } = useAuth()
  
  // Estados para PIN
  const [newPin, setNewPin] = useState(['', '', '', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', ''])
  const [currentPinForChange, setCurrentPinForChange] = useState(['', '', '', '', '', ''])
  const [currentPinForRemove, setCurrentPinForRemove] = useState(['', '', '', '', '', ''])
  const [mode, setMode] = useState('view')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Estados para contraseña
  const [passwordMode, setPasswordMode] = useState('view')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Estados para email
  const [emailMode, setEmailMode] = useState('view')
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  
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

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordMode('view')
  }

  const resetEmailForm = () => {
    setNewEmail('')
    setEmailPassword('')
    setEmailError('')
    setEmailMode('view')
  }

  // Cambio de contraseña
  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword) return setPasswordError('Ingresa tu contraseña actual')
    if (!newPassword) return setPasswordError('Ingresa la nueva contraseña')
    if (newPassword.length < 6) return setPasswordError('Mínimo 6 caracteres')
    if (newPassword !== confirmPassword) return setPasswordError('Las contraseñas no coinciden')
    if (currentPassword === newPassword) return setPasswordError('Debe ser diferente a la actual')

    setIsChangingPassword(true)
    const verifyResult = await verifyPassword(currentPassword)
    if (!verifyResult.success) {
      setPasswordError(verifyResult.error)
      setIsChangingPassword(false)
      return
    }

    const result = await changePassword(newPassword)
    setIsChangingPassword(false)
    if (result.success) {
      notifications.showSync('✅ Contraseña cambiada', 'success')
      resetPasswordForm()
    } else {
      setPasswordError(result.error)
    }
  }

  // Cambio de email
  const handleChangeEmail = async () => {
    setEmailError('')
    if (!newEmail) return setEmailError('Ingresa el nuevo email')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) return setEmailError('Email no válido')
    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) return setEmailError('Debe ser diferente al actual')
    if (!emailPassword) return setEmailError('Ingresa tu contraseña')

    setIsChangingEmail(true)
    const verifyResult = await verifyPassword(emailPassword)
    if (!verifyResult.success) {
      setEmailError('Contraseña incorrecta')
      setIsChangingEmail(false)
      return
    }

    const result = await changeEmail(newEmail)
    setIsChangingEmail(false)
    if (result.success) {
      notifications.showSync('📧 Enlace de confirmación enviado', 'success')
      resetEmailForm()
    } else {
      setEmailError(result.error)
    }
  }

  // Funciones PIN
  const handlePinInput = (value, index, pinArray, setPinArray, refs, nextRefs) => {
    if (value && !/^\d$/.test(value)) return
    const newArray = [...pinArray]
    newArray[index] = value
    setPinArray(newArray)
    setError('')
    if (value && index < 5) refs.current[index + 1]?.focus()
    else if (value && index === 5 && nextRefs) nextRefs.current[0]?.focus()
  }

  const handleKeyDown = (e, index, pinArray, setPinArray, refs) => {
    if (e.key === 'Backspace' && !pinArray[index] && index > 0) refs.current[index - 1]?.focus()
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
    if (pin1.length !== 6) return setError('PIN de 6 dígitos requerido')
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
      notifications.showSync('✅ PIN configurado', 'success')
      resetForm()
      checkPinExists()
    } else setError(result.error)
  }

  const handleChangePin = async () => {
    const currentPin = currentPinForChange.join('')
    const pin1 = newPin.join('')
    const pin2 = confirmPin.join('')
    if (currentPin.length !== 6) return setError('Ingresa tu PIN actual')
    if (pin1.length !== 6) return setError('PIN de 6 dígitos requerido')
    if (pin1 !== pin2) {
      setError('Los PINs no coinciden')
      setConfirmPin(['', '', '', '', '', ''])
      confirmPinRefs.current[0]?.focus()
      return
    }
    if (currentPin === pin1) return setError('Debe ser diferente al actual')

    setIsProcessing(true)
    const result = await changePin(currentPin, pin1)
    setIsProcessing(false)
    if (result.success) {
      notifications.showSync('✅ PIN cambiado', 'success')
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
    if (pin.length !== 6) return setError('Ingresa tu PIN actual')
    setIsProcessing(true)
    const result = await removePin(pin)
    setIsProcessing(false)
    if (result.success) {
      notifications.showSync('🔓 PIN eliminado', 'warning')
      resetForm()
      checkPinExists()
    } else {
      setError(result.error)
      setCurrentPinForRemove(['', '', '', '', '', ''])
      removePinRefs.current[0]?.focus()
    }
  }

  const renderPinInput = (pinArray, setPinArray, refs, nextRefs = null, disabled = false) => (
    <div className="flex justify-center gap-1.5" onPaste={(e) => handlePaste(e, setPinArray, refs)}>
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
          className="w-9 h-10 text-center text-lg font-bold border-2 rounded-lg transition-all
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Cuenta */}
      <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.email || 'No disponible'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Email de la cuenta</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setPasswordMode(passwordMode === 'view' ? 'change' : 'view'); resetEmailForm() }}
              className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                passwordMode === 'change' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-500'
              }`}
            >
              🔑
            </button>
            <button
              onClick={() => { setEmailMode(emailMode === 'view' ? 'change' : 'view'); resetPasswordForm() }}
              className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors ${
                emailMode === 'change' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-500'
              }`}
            >
              📧
            </button>
          </div>
        </div>

        {/* Form Contraseña */}
        {passwordMode === 'change' && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600 space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Cambiar contraseña</p>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError('') }}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              placeholder="Contraseña actual"
              disabled={isChangingPassword}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setPasswordError('') }}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              placeholder="Nueva contraseña (mín. 6)"
              disabled={isChangingPassword}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError('') }}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              placeholder="Confirmar nueva"
              disabled={isChangingPassword}
            />
            {passwordError && <p className="text-red-500 text-xs">❌ {passwordError}</p>}
            <div className="flex gap-2">
              <button onClick={resetPasswordForm} disabled={isChangingPassword} className="flex-1 px-2 py-1.5 text-xs bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancelar</button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isChangingPassword ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Form Email */}
        {emailMode === 'change' && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600 space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Cambiar email</p>
            <p className="text-[10px] text-yellow-600 dark:text-yellow-400">⚠️ Se enviará confirmación al nuevo email</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              placeholder="Nuevo email"
              disabled={isChangingEmail}
            />
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => { setEmailPassword(e.target.value); setEmailError('') }}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
              placeholder="Tu contraseña"
              disabled={isChangingEmail}
            />
            {emailError && <p className="text-red-500 text-xs">❌ {emailError}</p>}
            <div className="flex gap-2">
              <button onClick={resetEmailForm} disabled={isChangingEmail} className="flex-1 px-2 py-1.5 text-xs bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancelar</button>
              <button
                onClick={handleChangeEmail}
                disabled={isChangingEmail || !newEmail || !emailPassword}
                className="flex-1 px-2 py-1.5 text-xs bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {isChangingEmail ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PIN de Seguridad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{hasPin ? '🔒' : '🔓'}</span>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">PIN de Seguridad</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {hasPin ? 'Activo - Protege eliminación/edición' : 'Sin PIN configurado'}
              </p>
            </div>
          </div>
          {mode === 'view' && (
            <div className="flex gap-2">
              {!hasPin ? (
                <button
                  onClick={() => { setMode('setup'); setTimeout(() => newPinRefs.current[0]?.focus(), 100) }}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Configurar
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setMode('change'); setTimeout(() => currentPinRefs.current[0]?.focus(), 100) }}
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    Cambiar
                  </button>
                  <button
                    onClick={() => { setMode('remove'); setTimeout(() => removePinRefs.current[0]?.focus(), 100) }}
                    className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg font-medium"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Setup PIN */}
        {mode === 'setup' && (
          <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-3">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">Nuevo PIN (6 dígitos)</p>
            {renderPinInput(newPin, setNewPin, newPinRefs, confirmPinRefs)}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Confirmar</p>
            {renderPinInput(confirmPin, setConfirmPin, confirmPinRefs)}
            {error && <p className="text-red-500 text-xs text-center">❌ {error}</p>}
            <div className="flex gap-2">
              <button onClick={resetForm} disabled={isProcessing} className="flex-1 px-2 py-1.5 text-xs bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancelar</button>
              <button
                onClick={handleSetupPin}
                disabled={isProcessing || newPin.some(d => !d) || confirmPin.some(d => !d)}
                className="flex-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Change PIN */}
        {mode === 'change' && (
          <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">PIN Actual</p>
            {renderPinInput(currentPinForChange, setCurrentPinForChange, currentPinRefs, newPinRefs)}
            <hr className="border-gray-300 dark:border-slate-600" />
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Nuevo PIN</p>
            {renderPinInput(newPin, setNewPin, newPinRefs, confirmPinRefs)}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Confirmar</p>
            {renderPinInput(confirmPin, setConfirmPin, confirmPinRefs)}
            {error && <p className="text-red-500 text-xs text-center">❌ {error}</p>}
            <div className="flex gap-2">
              <button onClick={resetForm} disabled={isProcessing} className="flex-1 px-2 py-1.5 text-xs bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancelar</button>
              <button
                onClick={handleChangePin}
                disabled={isProcessing || currentPinForChange.some(d => !d) || newPin.some(d => !d) || confirmPin.some(d => !d)}
                className="flex-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : 'Cambiar'}
              </button>
            </div>
          </div>
        )}

        {/* Remove PIN */}
        {mode === 'remove' && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 space-y-3">
            <p className="text-xs text-red-600 dark:text-red-400 text-center">⚠️ Esto deshabilitará la protección</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Ingresa tu PIN actual</p>
            {renderPinInput(currentPinForRemove, setCurrentPinForRemove, removePinRefs)}
            {error && <p className="text-red-500 text-xs text-center">❌ {error}</p>}
            <div className="flex gap-2">
              <button onClick={resetForm} disabled={isProcessing} className="flex-1 px-2 py-1.5 text-xs bg-gray-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancelar</button>
              <button
                onClick={handleRemovePin}
                disabled={isProcessing || currentPinForRemove.some(d => !d)}
                className="flex-1 px-2 py-1.5 text-xs bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : 'Eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info PIN */}
      <details className="text-xs">
        <summary className="text-blue-600 dark:text-blue-400 cursor-pointer font-medium">ℹ️ ¿Qué protege el PIN?</summary>
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 space-y-1">
          <p><strong>🗑️ Eliminación:</strong> Gastos, compras, cortes, categorías, presupuestos</p>
          <p><strong>✏️ Edición:</strong> Gastos, compras, cortes, categorías, presupuestos</p>
        </div>
      </details>
    </div>
  )
}
