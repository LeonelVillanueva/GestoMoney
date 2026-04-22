import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_PROYECT_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_PUBLIC

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

