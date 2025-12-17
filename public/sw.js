// Service Worker para Gestor de Gastos PWA
// IMPORTANTE: Cambiar el número de versión cuando quieras forzar actualización del cache
const CACHE_NAME = 'gestor-gastos-v2'
const urlsToCache = [
  '/',
  '/index.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
]

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('Error al cachear recursos:', error)
      })
  )
  self.skipWaiting()
})

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Interceptar peticiones (estrategia: Network First)
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return
  }

  // No cachear peticiones a Supabase (debe ser siempre en tiempo real)
  if (event.request.url.includes('supabase.co') || event.request.url.includes('supabase.in')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Verificar si la respuesta es válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clonar la respuesta
        const responseToCache = response.clone()

        // Cachear la respuesta
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache)
          })

        return response
      })
      .catch(() => {
        // Si falla la red, intentar servir desde cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Si no hay en cache, devolver página offline si es una navegación
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html')
            }
          })
      })
  )
})

// Manejar mensajes del cliente (para actualizar cache, etc.)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

