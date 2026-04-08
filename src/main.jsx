import { createClient } from '@supabase/supabase-js';

// Vite requires 'import.meta.env' instead of 'process.env'
// Also requires the 'VITE_' prefix for variables to be exposed to the browser
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safety check: This will print a warning in your browser console (F12) 
// if your Vercel variables are missing.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "iqaPro Error: Supabase Environment Variables are missing! " +
    "Check your Vercel Dashboard for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
