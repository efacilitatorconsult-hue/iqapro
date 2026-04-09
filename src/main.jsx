// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// This 'try/catch' prevents extensions like Adobe/MetaMask from breaking your app load
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (e) {
  console.error("Supabase failed to initialize, likely a header/extension conflict:", e)
}

export { supabase }
