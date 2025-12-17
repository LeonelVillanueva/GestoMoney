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

    // Crear contenedor para la notificación
    const container = document.createElement('div')
    container.id = `notification-${Date.now()}`
    document.body.appendChild(container)

    const root = createRoot(container)

    const handleClose = () => {
      root.unmount()
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container)
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
      setTimeout(() => {
        handleClose()
      }, notificationDuration)
    }
  }

  /**
   * Muestra una notificación de progreso para gastos
   * @param {Object} expenseData - Datos del gasto
   * @param {number} newTotal - Nuevo total
   * @param {Function} callback - Callback cuando se cierra
   */
  showExpenseProgress(expenseData, newTotal, callback) {
    if (!this.settings.enabled || this.progressNotificationVisible) return

    this.progressNotificationVisible = true

    // Calcular total anterior
    const currentTotal = newTotal - expenseData.amount

    // Crear contenedor
    const container = document.createElement('div')
    container.id = `progress-notification-${Date.now()}`
    document.body.appendChild(container)

    const root = createRoot(container)

    const handleClose = () => {
      this.progressNotificationVisible = false
      root.unmount()
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
        if (callback) callback()
      }, 300)
    }

    root.render(
      <ProgressNotification
        isVisible={true}
        onClose={handleClose}
        expenseData={expenseData}
        currentTotal={currentTotal}
        newTotal={newTotal}
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
