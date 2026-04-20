import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const availableVars = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).join(', ');
  throw new Error(
    `Missing Supabase keys! URL exists: ${!!supabaseUrl}, Key exists: ${!!supabaseAnonKey}. Available VITE_ vars: ${availableVars || 'None'}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
