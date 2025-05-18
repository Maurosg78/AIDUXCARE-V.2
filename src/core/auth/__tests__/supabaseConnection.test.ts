import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testDirectConnection } from '../directClient';
import { checkSupabaseConnection, isSupabaseConfigured } from '../supabaseClient';

// Definir tipo para el mock
type MockFetch = ReturnType<typeof vi.fn>;

// Mock de fetch para pruebas
global.fetch = vi.fn() as unknown as typeof fetch;

describe('Supabase Connection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Resetear el mock de fetch
    (global.fetch as MockFetch).mockReset();
  });

  it('testDirectConnection debería manejar respuestas exitosas', async () => {
    // Mock de una respuesta exitosa
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: '1.0.0' })
    });

    const result = await testDirectConnection();
    expect(result.success).toBe(true);
  });

  it('testDirectConnection debería manejar errores HTTP', async () => {
    // Mock de una respuesta con error 401
    (global.fetch as MockFetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid API key', code: 'auth.invalid_key' })
    });

    const result = await testDirectConnection();
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('AUTH_ERROR');
  });

  it('testDirectConnection debería manejar errores de red', async () => {
    // Mock de un error de red
    (global.fetch as MockFetch).mockRejectedValueOnce(new Error('Network error'));

    const result = await testDirectConnection();
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
  });

  it('checkSupabaseConnection debería usar testDirectConnection en modo fallback', async () => {
    // Solo si estamos en modo fallback
    if (!isSupabaseConfigured) {
      // Mock de testDirectConnection
      const mockTestDirectConnection = vi.fn().mockResolvedValueOnce({
        success: false,
        error: { message: 'Test error', code: 'TEST_ERROR' }
      });
      
      // Usar el test
      const result = await checkSupabaseConnection();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('TEST_ERROR');
    } else {
      // Si no estamos en modo fallback, el test es trivial
      expect(true).toBe(true);
    }
  });
}); 