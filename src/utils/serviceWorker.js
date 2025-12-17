// Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado exitosamente:', registration.scope)
          
          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update()
          }, 3600000) // 1 hora
        })
        .catch((error) => {
          console.error('Error al registrar Service Worker:', error)
        })
    })

    // Escuchar actualizaciones del Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
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
