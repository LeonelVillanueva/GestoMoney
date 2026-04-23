import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_PROYECT_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_PUBLIC
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan SUPABASE_PROYECT_URL/SUPABASE_ANON_PUBLIC en entorno de servidor para auth API'
  )
}

export function createAuthServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

export function createAuthAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE en entorno de servidor para operaciones admin de auth')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

