import React, { useState, useEffect } from 'react'

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-black'
      default:
        return 'bg-slate-500 text-white'
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
      <div className={`${getTypeStyles()} rounded-lg shadow-lg p-4 max-w-sm`}>
        <div className="flex items-center space-x-3">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="flex-1">
            <p className="font-medium">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-2 text-white hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notification

