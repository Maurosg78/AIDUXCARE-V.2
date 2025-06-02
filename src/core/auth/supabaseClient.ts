// src/core/auth/supabaseClient.ts
// Cliente Supabase centralizado - sin múltiples instancias
import { supabase } from '@/lib/supabase';

console.log('⚙️ Usando cliente Supabase centralizado...');

// Re-exportar el cliente único para compatibilidad
export default supabase;
export { supabase };
