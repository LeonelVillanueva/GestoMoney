import React from 'react'
import { createRoot } from 'react-dom/client'
import Notification from '../../components/Notification'
import ProgressNotification from '../../components/ProgressNotification'
import ConfirmDialog from '../../components/ConfirmDialog'

const NOTIFICATION_CAP = 6

const MS_EXIT_DISMISS = 300
const MS_EXIT_EVICT = 420

const effectiveMax = (n) => {
  const v = Number(n) || NOTIFICATION_CAP
  return Math.min(NOTIFICATION_CAP, Math.max(1, v))
}

class NotificationService {
  constructor() {
    this.settings = {
      enabled: true,
      sound: true,
      duration: 4000,
      maxNotifications: NOTIFICATION_CAP
    }
    /** Más reciente al inicio del array, más antigua al final */
    this.toastInstances = []
    this.stackElement = null
    this.progressNotificationVisible = false
    this.progressNotificationRoot = null
    this.progressNotificationContainer = null
    this.progressNotificationTimeout = null
    this.audioCtx = null
    this.lastSoundAt = 0
  }

  playNotificationSound(type = 'info') {
    if (!this.settings.sound || typeof window === 'undefined') return

    const now = Date.now()
    // Evita una ráfaga de sonidos si llegan varios toasts juntos.
    if (now - this.lastSoundAt < 120) return
    this.lastSoundAt = now

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    try {
      if (!this.audioCtx) this.audioCtx = new AudioCtx()
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {})
      }

      const ctx = this.audioCtx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // Frecuencia suave por defecto y variación leve según tipo.
      const frequencyMap = {
        success: 880,
        warning: 660,
        error: 440,
        info: 740
      }

      const freq = frequencyMap[type] || frequencyMap.info
      osc.type = type === 'error' ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.12)
    } catch {
      // Silencioso: no rompemos notificaciones visuales por audio.
    }
  }

  ensureStack() {
    if (this.stackElement && this.stackElement.parentNode) {
      return this.stackElement
    }
    const el = document.getElementById('app-notification-stack') || document.createElement('div')
    if (!el.id) el.id = 'app-notification-stack'
    // Centrado horizontal; ancho tope 20 rem y nunca a ras del borde (100vw − 2 rem).
    el.className = [
      'pointer-events-none fixed z-[200] left-1/2 flex -translate-x-1/2 flex-col items-stretch gap-2.5',
      'w-[min(20rem,calc(100vw-2rem))] max-w-sm',
      'top-[max(0.75rem,env(safe-area-inset-top,0px))]',
      'max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1.5rem))]',
      'overflow-y-auto overflow-x-hidden overscroll-contain',
      // Scroll sigue activo; la barra no se muestra (Firefox / WebKit / legado).
      '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0'
    ].join(' ')
    el.setAttribute('aria-live', 'polite')
    if (!el.parentNode) {
      document.body.appendChild(el)
    }
    this.stackElement = el
    return el
  }

  pruneEmptyStack() {
    if (this.stackElement && this.stackElement.parentNode && this.toastInstances.length === 0) {
      this.stackElement.parentNode.removeChild(this.stackElement)
      this.stackElement = null
    }
  }

  unmountToastDom(entry) {
    try {
      entry.root.unmount()
    } catch (e) {
      // ignora
    }
    if (entry.container && entry.container.parentNode) {
      entry.container.parentNode.removeChild(entry.container)
    }
    this.pruneEmptyStack()
  }

  /**
   * @param {object} entry
   * @param {{ animated?: boolean, onComplete?: () => void, eviction?: boolean }} [opts]
   * eviction: expulsión por tope; animación un poco más lenta, en móvil baja hacia abajo.
   */
  removeToastEntry(entry, opts = {}) {
    const { animated = true, onComplete, eviction = false } = opts
    const idx = this.toastInstances.indexOf(entry)
    if (idx === -1) {
      onComplete?.()
      return
    }
    if (entry.clearTimeout) {
      clearTimeout(entry.clearTimeout)
      entry.clearTimeout = null
    }
    this.toastInstances.splice(idx, 1)
    const el = entry.container
    if (!el) {
      onComplete?.()
      return
    }

    const done = () => {
      this.unmountToastDom(entry)
      onComplete?.()
    }

    if (animated) {
      const ms = eviction ? MS_EXIT_EVICT : MS_EXIT_DISMISS
      el.setAttribute('data-leaving', eviction ? 'evict' : 'dismiss')
      if (eviction) {
        el.classList.remove('duration-300', 'ease-out', 'duration-[280ms]')
        el.classList.add('duration-[420ms]', 'ease-in', 'origin-bottom')
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.classList.remove('origin-top', 'scale-100', 'scale-90', 'translate-y-0', 'opacity-100')
            el.classList.add('origin-bottom', 'translate-y-3', 'scale-90', 'opacity-0')
          })
        })
        setTimeout(done, ms)
      } else {
        el.classList.remove('duration-300', 'duration-[420ms]')
        el.classList.add('origin-top', 'duration-300', 'ease-in')
        el.classList.remove('translate-y-0', 'scale-100', 'scale-90', 'opacity-100')
        el.classList.add('opacity-0', 'scale-90', '-translate-y-1.5')
        setTimeout(done, MS_EXIT_DISMISS)
      }
    } else {
      done()
    }
  }

  /** Más antigua = última del arreglo */
  removeOldestToast(animated, onComplete) {
    if (this.toastInstances.length === 0) {
      onComplete?.()
      return
    }
    const oldest = this.toastInstances[this.toastInstances.length - 1]
    this.removeToastEntry(oldest, { animated, onComplete, eviction: true })
  }

  /**
   * Muestra toasts; máximo 6 en pantalla; la más antigua se desvanece al añadir otra.
   */
  showSync(message, type = 'info', duration = null) {
    if (!this.settings.enabled) return

    const notificationDuration = duration != null && duration > 0 ? duration : this.settings.duration
    const max = effectiveMax(this.settings.maxNotifications)
    this.playNotificationSound(type)

    const pushToast = () => {
      const stack = this.ensureStack()
      const itemWrap = document.createElement('div')
      // Entrada estilo aviso Android: baja un poco desde arriba y crece con origin-top (eje arriba-centro).
      itemWrap.className =
        'pointer-events-auto w-full min-w-0 origin-top ' +
        'transform transition-all duration-300 ease-out ' +
        'scale-90 opacity-0 -translate-y-3'
      stack.insertBefore(itemWrap, stack.firstChild)

      const inner = document.createElement('div')
      inner.className = 'w-full min-w-0'
      itemWrap.appendChild(inner)

      const root = createRoot(inner)
      const entry = { container: itemWrap, root, clearTimeout: null }
      this.toastInstances.unshift(entry)

      const handleClose = () => {
        this.removeToastEntry(entry, { animated: true, eviction: false })
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          itemWrap.classList.remove('scale-90', 'opacity-0', '-translate-y-3')
          itemWrap.classList.add('scale-100', 'translate-y-0', 'opacity-100')
        })
      })

      root.render(
        <Notification message={message} type={type} onClose={handleClose} />
      )

      if (notificationDuration > 0) {
        entry.clearTimeout = setTimeout(() => {
          this.removeToastEntry(entry, { animated: true })
        }, notificationDuration)
      }
    }

    const go = () => {
      if (this.toastInstances.length >= max) {
        this.removeOldestToast(true, go)
        return
      }
      pushToast()
    }
    go()
  }

  closeCurrentProgressNotification() {
    if (this.progressNotificationTimeout) {
      clearTimeout(this.progressNotificationTimeout)
      this.progressNotificationTimeout = null
    }

    if (this.progressNotificationRoot) {
      try {
        this.progressNotificationRoot.unmount()
      } catch (e) {
        // ignora
      }
      this.progressNotificationRoot = null
    }

    if (this.progressNotificationContainer && this.progressNotificationContainer.parentNode) {
      this.progressNotificationContainer.parentNode.removeChild(this.progressNotificationContainer)
      this.progressNotificationContainer = null
    }

    this.progressNotificationVisible = false
  }

  showExpenseProgress(expenseData, totalsData, callback) {
    if (!this.settings.enabled) return

    this.closeCurrentProgressNotification()

    this.progressNotificationVisible = true

    const container = document.createElement('div')
    container.id = `progress-notification-${Date.now()}`
    document.body.appendChild(container)

    const root = createRoot(container)

    this.progressNotificationContainer = container
    this.progressNotificationRoot = root

    const handleClose = () => {
      if (this.progressNotificationTimeout) {
        clearTimeout(this.progressNotificationTimeout)
        this.progressNotificationTimeout = null
      }

      this.progressNotificationVisible = false

      if (this.progressNotificationRoot === root) {
        try {
          root.unmount()
        } catch (e) {
          // ignora
        }
        this.progressNotificationRoot = null
      }

      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
        if (this.progressNotificationContainer === container) {
          this.progressNotificationContainer = null
        }
        if (callback) callback()
      }, 300)
    }

    root.render(
      <ProgressNotification
        isVisible={true}
        onClose={handleClose}
        expenseData={expenseData}
        totalsData={totalsData}
        duration={this.settings.duration || 5000}
      />
    )
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
  }

  confirm({
    title = 'Confirmar acción',
    message = '¿Deseas continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    tone = 'info'
  } = {}) {
    return new Promise((resolve) => {
      const container = document.createElement('div')
      container.id = `confirm-dialog-${Date.now()}`
      document.body.appendChild(container)
      const root = createRoot(container)

      const cleanup = () => {
        try {
          root.unmount()
        } catch (error) {
          // ignora
        }
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
      }

      const handleConfirm = () => {
        cleanup()
        resolve(true)
      }

      const handleCancel = () => {
        cleanup()
        resolve(false)
      }

      root.render(
        <ConfirmDialog
          title={title}
          message={message}
          confirmText={confirmText}
          cancelText={cancelText}
          tone={tone}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )
    })
  }
}

const notifications = new NotificationService()

export default notifications
