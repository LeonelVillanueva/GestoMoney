import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Proxy /api/exchange-rate en dev y preview: la clave EXCHANGE_API_KEY solo existe en el servidor (loadEnv).
 * No usar VITE_EXCHANGE_API_KEY en el bundle del cliente.
 */
function attachExchangeRateProxy(server, env) {
  server.middlewares.use(async (req, res, next) => {
    const path = req.url?.split('?')[0]
    if (path !== '/api/exchange-rate') return next()
    if (req.method !== 'GET') return next()

    const key = env.EXCHANGE_API_KEY || env.VITE_EXCHANGE_API_KEY
    if (!key) {
      res.statusCode = 501
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'EXCHANGE_API_KEY no configurada' }))
      return
    }

    try {
      const upstream = await fetch(
        `https://v6.exchangerate-api.com/v6/${key}/pair/USD/HNL`
      )
      const text = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
      res.end(text)
    } catch {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Fallo al contactar el servicio de tasas' }))
    }
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'exchange-rate-proxy',
        configureServer(server) {
          attachExchangeRateProxy(server, env)
        },
        configurePreviewServer(server) {
          attachExchangeRateProxy(server, env)
        }
      }
    ],
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets'
    },
    server: {
      port: 5173,
      hmr: true,
      watch: {
        usePolling: true
      }
    },
    optimizeDeps: {
      exclude: ['sql.js'],
      include: ['sql.js/dist/sql-wasm.js']
    },
    define: {
      global: 'globalThis',
      'import.meta.env.SUPABASE_PROYECT_URL': JSON.stringify(env.SUPABASE_PROYECT_URL),
      'import.meta.env.SUPABASE_ANON_PUBLIC': JSON.stringify(env.SUPABASE_ANON_PUBLIC)
    }
  }
})
