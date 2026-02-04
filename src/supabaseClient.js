import { createClient } from '@supabase/supabase-js'

// Lee credenciales de variables de entorno (archivo .env o .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY')
    console.error('✅ Solución: Copia .env.example a .env.local y rellena tus credenciales de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)