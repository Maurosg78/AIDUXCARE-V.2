import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env';

// Crear cliente de Supabase con las credenciales
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

export default supabase; 