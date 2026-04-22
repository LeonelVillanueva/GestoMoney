import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_PROYECT_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_PUBLIC

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Verifica que tu archivo .env.local contenga SUPABASE_PROYECT_URL y SUPABASE_ANON_PUBLIC'
  )
}

const memoryStore = (() => {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    }
  }
})()

/**
 * Endurecimiento de sesión:
 * - Sin persistencia de auth en storage del navegador (solo memoria en runtime).
 * - La sesión fuente de verdad vive en cookie HttpOnly del backend.
 * - PKCE para flujo de autenticación.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: memoryStore,
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})
