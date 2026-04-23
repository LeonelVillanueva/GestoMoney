import React, { useState } from 'react'

const Notification = ({ message, type = 'info', onClose }) => {
  const [visible, setVisible] = useState(true)

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-zinc-900/95 border border-zinc-800 border-l-4 border-l-emerald-500 text-zinc-100 shadow-xl shadow-black/40 backdrop-blur-sm'
      case 'error':
        return 'bg-zinc-900/95 border border-zinc-800 border-l-4 border-l-red-500 text-zinc-100 shadow-xl shadow-black/40 backdrop-blur-sm'
      case 'warning':
        return 'bg-zinc-900/95 border border-zinc-800 border-l-4 border-l-amber-500 text-zinc-100 shadow-xl shadow-black/40 backdrop-blur-sm'
      default:
        return 'bg-zinc-900/95 border border-zinc-800 border-l-4 border-l-sky-500 text-zinc-100 shadow-xl shadow-black/40 backdrop-blur-sm'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return 'ℹ️'
    }
  }

  // Detectar si el mensaje ya tiene un emoji al inicio
  const hasEmojiAtStart = (text) => {
    if (!text || text.length === 0) return false
    // Patrón para detectar emojis (incluye la mayoría de emojis Unicode)
    const emojiPattern = /^[\u{1F300}-\u{1F9FF}]|^[\u{2600}-\u{26FF}]|^[\u{2700}-\u{27BF}]|^[\u{1F600}-\u{1F64F}]|^[\u{1F680}-\u{1F6FF}]|^[\u{1F1E0}-\u{1F1FF}]|^[\u{1F900}-\u{1F9FF}]|^[\u{1FA00}-\u{1FA6F}]|^[\u{1FA70}-\u{1FAFF}]/u
    return emojiPattern.test(text.trim())
  }

  const shouldShowIcon = !hasEmojiAtStart(message)
  const icon = shouldShowIcon ? getIcon() : null

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div
        className={`${getTypeStyles()} rounded-lg p-4 max-w-sm`}
        role={type === 'error' ? 'alert' : 'status'}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        aria-atomic='true'
      >
        <div className="flex items-center space-x-3">
          {icon && <span className="text-xl opacity-90">{icon}</span>}
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-100">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 rounded-md p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notification

