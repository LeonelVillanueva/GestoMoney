import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_PROYECT_URL
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_PUBLIC

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. ' +
    'Verifica que tu archivo .env.local contenga SUPABASE_PROYECT_URL y SUPABASE_ANON_PUBLIC'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
