import React from 'react'
import { createRoot } from 'react-dom/client'
import Notification from '../../components/Notification'
import ProgressNotification from '../../components/ProgressNotification'

/**
 * Sistema de notificaciones
 */
class NotificationService {
  constructor() {
    this.settings = {
      enabled: true,
      sound: true,
      duration: 4000,
      maxNotifications: 5
    }
    this.notificationQueue = []
    this.currentNotifications = []
    this.progressNotificationVisible = false
    // Referencias para la notificación actual (para reemplazarla)
    this.currentNotificationRoot = null
    this.currentNotificationContainer = null
    this.currentNotificationTimeout = null
    // Referencias para la notificación de progreso (para reemplazarla)
    this.progressNotificationRoot = null
    this.progressNotificationContainer = null
    this.progressNotificationTimeout = null
  }

  /**
   * Cierra la notificación actual si existe
   */
  closeCurrentNotification() {
    // Limpiar timeout anterior
    if (this.currentNotificationTimeout) {
      clearTimeout(this.currentNotificationTimeout)
      this.currentNotificationTimeout = null
    }

    // Desmontar y eliminar contenedor anterior
    if (this.currentNotificationRoot) {
      try {
        this.currentNotificationRoot.unmount()
      } catch (e) {
        // Ignorar errores si ya fue desmontado
      }
      this.currentNotificationRoot = null
    }

    if (this.currentNotificationContainer && this.currentNotificationContainer.parentNode) {
      this.currentNotificationContainer.parentNode.removeChild(this.currentNotificationContainer)
      this.currentNotificationContainer = null
    }
  }

  /**
   * Muestra una notificación síncrona
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duración en ms (opcional)
   */
  showSync(message, type = 'info', duration = null) {
    if (!this.settings.enabled) return

    const notificationDuration = duration || this.settings.duration

    // Cerrar notificación anterior si existe (reemplazar)
    this.closeCurrentNotification()

    // Crear contenedor para la notificación
    const container = document.createElement('div')
    container.id = `notification-${Date.now()}`
    document.body.appendChild(container)

    const root = createRoot(container)

    // Guardar referencias
    this.currentNotificationContainer = container
    this.currentNotificationRoot = root

    const handleClose = () => {
      // Limpiar timeout
      if (this.currentNotificationTimeout) {
        clearTimeout(this.currentNotificationTimeout)
        this.currentNotificationTimeout = null
      }

      // Desmontar
      if (this.currentNotificationRoot === root) {
        try {
          root.unmount()
        } catch (e) {
          // Ignorar errores
        }
        this.currentNotificationRoot = null
      }

      // Eliminar contenedor
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
        if (this.currentNotificationContainer === container) {
          this.currentNotificationContainer = null
        }
      }, 300)
    }

    root.render(
      <Notification
        message={message}
        type={type}
        duration={notificationDuration}
        onClose={handleClose}
      />
    )

    // Auto-cerrar si tiene duración
    if (notificationDuration > 0) {
      this.currentNotificationTimeout = setTimeout(() => {
        handleClose()
      }, notificationDuration)
    }
  }

  /**
   * Cierra la notificación de progreso actual si existe
   */
  closeCurrentProgressNotification() {
    // Limpiar timeout anterior
    if (this.progressNotificationTimeout) {
      clearTimeout(this.progressNotificationTimeout)
      this.progressNotificationTimeout = null
    }

    // Desmontar y eliminar contenedor anterior
    if (this.progressNotificationRoot) {
      try {
        this.progressNotificationRoot.unmount()
      } catch (e) {
        // Ignorar errores si ya fue desmontado
      }
      this.progressNotificationRoot = null
    }

    if (this.progressNotificationContainer && this.progressNotificationContainer.parentNode) {
      this.progressNotificationContainer.parentNode.removeChild(this.progressNotificationContainer)
      this.progressNotificationContainer = null
    }

    this.progressNotificationVisible = false
  }

  /**
   * Muestra una notificación de progreso para gastos
   * @param {Object} expenseData - Datos del gasto/ingreso
   * @param {Object} totalsData - Datos de los totales (gastos, ingresos, neto)
   * @param {Function} callback - Callback cuando se cierra
   */
  showExpenseProgress(expenseData, totalsData, callback) {
    if (!this.settings.enabled) return

    // Cerrar notificación de progreso anterior si existe (reemplazar)
    this.closeCurrentProgressNotification()

    this.progressNotificationVisible = true

    // Crear contenedor
    const container = document.createElement('div')
    container.id = `progress-notification-${Date.now()}`
    document.body.appendChild(container)

    const root = createRoot(container)

    // Guardar referencias
    this.progressNotificationContainer = container
    this.progressNotificationRoot = root

    const handleClose = () => {
      // Limpiar timeout
      if (this.progressNotificationTimeout) {
        clearTimeout(this.progressNotificationTimeout)
        this.progressNotificationTimeout = null
      }

      this.progressNotificationVisible = false

      // Desmontar
      if (this.progressNotificationRoot === root) {
        try {
          root.unmount()
        } catch (e) {
          // Ignorar errores
        }
        this.progressNotificationRoot = null
      }

      // Eliminar contenedor
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

  /**
   * Actualiza la configuración de notificaciones
   * @param {Object} newSettings - Nuevas configuraciones
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
  }
}

// Crear instancia única (singleton)
const notifications = new NotificationService()

export default notifications
