import { Session } from '@supabase/supabase-js';

/**
 * Clase para simular la autenticación de Supabase en los tests
 * Permite cambiar entre diferentes sesiones para probar RLS
 */
export class SupabaseAuthMock {
  private currentSession: Session | null = null;

  /**
   * Establece la sesión actual para las pruebas
   * @param session Sesión a usar para autenticación
   */
  setSession(session: Session): void {
    this.currentSession = session;
  }

  /**
   * Limpia la sesión actual 
   */
  clearSession(): void {
    this.currentSession = null;
  }

  /**
   * Retorna la sesión actual (usado por los mocks de Supabase)
   */
  getSession(): { data: { session: Session | null }, error: null } {
    return {
      data: { session: this.currentSession },
      error: null
    };
  }

  /**
   * Simula la función getUser de la API de Supabase Auth
   */
  getUser() {
    if (!this.currentSession?.user) {
      return { data: { user: null }, error: null };
    }
    
    return {
      data: { user: this.currentSession.user },
      error: null
    };
  }
}

// Exportamos una instancia singleton
export const supabaseAuthMock = new SupabaseAuthMock(); 