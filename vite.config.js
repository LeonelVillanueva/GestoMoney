import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import {
  applyCorsHeaders,
  corsHeadersForAllowedOrigin,
  originAllowedForExchangeApi,
  resolveExchangeRateAllowedOrigins
} from './lib/exchangeRateApiSecurity.js'

/**
 * Proxy /api/exchange-rate en dev y preview: EXCHANGE_API_KEY solo en servidor (loadEnv).
 * CORS: misma política que api/exchange-rate.js (ALLOWED_ORIGINS + URLs Vercel o localhost por defecto).
 */
function attachExchangeRateProxy(server, env) {
  server.middlewares.use(async (req, res, next) => {
    const path = req.url?.split('?')[0]
    if (path !== '/api/exchange-rate') return next()

    const allowedOrigins = resolveExchangeRateAllowedOrigins(env)
    const origin = req.headers?.origin

    if (req.method === 'OPTIONS') {
      if (!originAllowedForExchangeApi(origin, allowedOrigins)) {
        res.statusCode = 403
        return res.end()
      }
      applyCorsHeaders(res, corsHeadersForAllowedOrigin(origin, allowedOrigins))
      res.statusCode = 204
      return res.end()
    }

    if (req.method !== 'GET') return next()

    if (!originAllowedForExchangeApi(origin, allowedOrigins)) {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Origen no autorizado' }))
      return
    }

    applyCorsHeaders(res, corsHeadersForAllowedOrigin(origin, allowedOrigins))

    const key = env.EXCHANGE_API_KEY
    if (!key) {
      res.statusCode = 501
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Servicio de tasas no configurado' }))
      return
    }

    try {
      const upstream = await fetch(
        `https://v6.exchangerate-api.com/v6/${key}/pair/USD/HNL`
      )

      if (!upstream.ok) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Servicio de tasas no disponible' }))
        return
      }

      const text = await upstream.text()
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Respuesta de tasas no válida' }))
        return
      }

      if (parsed && typeof parsed === 'object' && parsed.error && !parsed.conversion_rate) {
        res.statusCode = 502
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Servicio de tasas no disponible' }))
        return
      }

      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(parsed))
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
