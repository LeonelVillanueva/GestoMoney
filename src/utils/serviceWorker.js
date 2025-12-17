// Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado exitosamente:', registration.scope)
          
          // Verificar actualizaciones cada 15 minutos (más frecuente para detectar cambios más rápido)
          setInterval(() => {
            registration.update()
          }, 900000) // 15 minutos
          
          // Verificar actualizaciones cuando el usuario vuelve a la app (más rápido)
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              registration.update()
            }
          })
          
          // Verificar actualizaciones cuando la ventana obtiene foco
          window.addEventListener('focus', () => {
            registration.update()
          })
        })
        .catch((error) => {
          console.error('Error al registrar Service Worker:', error)
        })
    })

    // Escuchar actualizaciones del Service Worker y recargar automáticamente
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
    
    // También escuchar cuando hay un nuevo Service Worker esperando
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload()
      }
    })
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister()
    })
  }
}

