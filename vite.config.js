import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
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
      // Exponer variables de entorno de Supabase
      'import.meta.env.SUPABASE_PROYECT_URL': JSON.stringify(env.SUPABASE_PROYECT_URL),
      'import.meta.env.SUPABASE_ANON_PUBLIC': JSON.stringify(env.SUPABASE_ANON_PUBLIC),
      // Exponer variable de entorno de Exchange API
      'import.meta.env.VITE_EXCHANGE_API_KEY': JSON.stringify(env.VITE_EXCHANGE_API_KEY),
    }
  }
})
