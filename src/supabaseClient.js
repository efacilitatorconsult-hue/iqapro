import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (e) {
  console.error("Supabase failed to initialize:", e)
}

export { supabase }
