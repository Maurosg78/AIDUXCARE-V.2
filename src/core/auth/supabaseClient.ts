import { createClient } from '@supabase/supabase-js';

// Usar valores directamente en lugar de importarlos
const supabaseUrl = 'https://mchyxyuaegsbrwodengr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaHl4eXVhZWdzYnJ3b2RlbmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3OTE5ODcsImV4cCI6MjAzMTM2Nzk4N30.nPADTDUw7cKLsGI83tsDLmYxQWR1N7swPZWwrKoH-S4';

// Crear cliente de Supabase con las credenciales
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export default supabase; 