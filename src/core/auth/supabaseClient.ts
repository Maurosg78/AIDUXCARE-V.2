import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 