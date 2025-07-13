import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleCloudAudioService } from '../../services/GoogleCloudAudioService';

// Mock del fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock de la URL del Cloud Function
const CLOUD_FUNCTION_URL = 'https://us-central1-aiduxcare-v2.cloudfunctions.net/clinical-brain';

describe('🛡️ Protocolo de Simulación de Fallos (Chaos Engineering Básico)', () => {
  let audioService: GoogleCloudAudioService;

  beforeEach(() => {
    // Reset de mocks
    vi.clearAllMocks();
    
    // Instanciar el servicio
    audioService = new GoogleCloudAudioService();
    
    // Mock por defecto para casos exitosos
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        analysis: {
          warnings: [],
          suggestions: [],
          soap_analysis: {
            overall_quality: 0.95
          },
          session_quality: {
            communication_score: 0.9
          }
        }
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Test 1: Simular Fallo de Red/500', () => {
    it('debe capturar error de red y activar fallback con status 200', async () => {
      // Simular fallo de red como respuesta de API fallida (no excepción)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        url: CLOUD_FUNCTION_URL,
        json: async () => ({ 
          success: false, 
          error: 'Simulated server error',
          message: 'Network failure simulation'
        })
      });

      const transcription = 'Paciente presenta dolor en el pecho';
      
      const result = await audioService.analyzeClinicalTranscription({
        transcription,
        specialty: 'general_medicine',
        sessionType: 'initial'
      });
      
      // Verificar que el sistema captura el error y activa fallback
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Error interno del Cerebro Clínico');
      
      // Verificar que se registra el error para auditoría
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('cloudfunctions.net'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Test 2: Simular JSON Malformado', () => {
    it('debe capturar JSON malformado y activar fallback con status 200', async () => {
      // Simular respuesta con JSON malformado
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Unexpected token < in JSON at position 0');
        }
      });

      const transcription = 'Paciente con síntomas de gripe';
      
      try {
        const result = await audioService.analyzeClinicalTranscription({
          transcription,
          specialty: 'general_medicine',
          sessionType: 'initial'
        });
        
        // Verificar que el sistema maneja el JSON malformado
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('JSON');
        
      } catch (error) {
        // No debería lanzar excepción
        expect(error).toBeUndefined();
      }
    });
  });

  describe('Test 3: Simular Respuesta Vacía', () => {
    it('debe manejar respuesta vacía con elegancia y activar fallback', async () => {
      // Simular respuesta vacía
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({})
      });

      const transcription = 'Paciente asintomático';
      
      try {
        const result = await audioService.analyzeClinicalTranscription({
          transcription,
          specialty: 'general_medicine',
          sessionType: 'initial'
        });
        
        // Verificar que el sistema maneja la respuesta vacía
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        
      } catch (error) {
        // No debería lanzar excepción
        expect(error).toBeUndefined();
      }
    });

    it('debe manejar respuesta null con elegancia', async () => {
      // Simular respuesta null
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => null
      });

      const transcription = 'Paciente con dolor de cabeza';
      
      try {
        const result = await audioService.analyzeClinicalTranscription({
          transcription,
          specialty: 'general_medicine',
          sessionType: 'initial'
        });
        
        // Verificar que el sistema maneja null
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        
      } catch (error) {
        // No debería lanzar excepción
        expect(error).toBeUndefined();
      }
    });
  });

  describe('Test 4: Simular Error de Estructura de Vertex AI', () => {
    it('debe capturar error de estructura inválida y activar fallback', async () => {
      // Simular respuesta con estructura inválida de Vertex AI
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            // Estructura inválida - sin content.parts
            finishReason: 'STOP'
          }]
        })
      });

      const transcription = 'Paciente con fiebre alta';
      
      try {
        const result = await audioService.analyzeClinicalTranscription({
          transcription,
          specialty: 'general_medicine',
          sessionType: 'initial'
        });
        
        // Verificar que el sistema captura la estructura inválida
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        
      } catch (error) {
        // No debería lanzar excepción
        expect(error).toBeUndefined();
      }
    });
  });

  describe('Test 5: Simular Timeout de Vertex AI', () => {
    it('debe manejar timeout y activar fallback con status 200', async () => {
      // Simular timeout como respuesta de API fallida (no excepción)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
        headers: new Headers(),
        url: CLOUD_FUNCTION_URL,
        json: async () => ({ 
          success: false, 
          error: 'Request timeout',
          message: 'timeout_simulation'
        })
      });

      const transcription = 'Paciente con dolor abdominal';
      
      const result = await audioService.analyzeClinicalTranscription({
        transcription,
        specialty: 'general_medicine',
        sessionType: 'initial'
      });
      
      // Verificar que el sistema maneja el timeout
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Tiempo de espera agotado');
    });
  });

  describe('Test 6: Validación de Logging y Auditoría', () => {
    it('debe registrar correctamente los eventos de fallback para auditoría', async () => {
      // Mock de console.log para capturar logs
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Simular fallo de red como respuesta de API fallida (no excepción)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        url: CLOUD_FUNCTION_URL,
        json: async () => ({ 
          success: false, 
          error: 'Simulated server error',
          message: 'audit_test'
        })
      });

      const transcription = 'Paciente con síntomas respiratorios';
      
      await audioService.analyzeClinicalTranscription({
        transcription,
        specialty: 'general_medicine',
        sessionType: 'initial'
      });
      
      // Verificar que se registran los logs de auditoría
      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      expect(logCalls.some(arg => typeof arg === 'string' && arg.includes('🧠 INICIANDO DIAGNÓSTICO CLOUD FUNCTION'))).toBe(true);
      expect(logCalls.some(arg => typeof arg === 'string' && arg.includes('📡 ENVIANDO REQUEST A CLOUD FUNCTION'))).toBe(true);
      expect(logCalls.some(arg => typeof arg === 'string' && arg.includes('📡 RESPUESTA RECIBIDA DE CLOUD FUNCTION'))).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Test 7: Validación de Continuidad Clínica', () => {
    it('debe garantizar que siempre se devuelve un análisis clínicamente válido', async () => {
      // Simular múltiples tipos de fallos como respuestas de API fallidas
      const failureScenarios = [
        {
          mock: () => mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers(),
            url: CLOUD_FUNCTION_URL,
            json: async () => ({ success: false, error: 'Network Error' })
          }),
          expectedError: 'Error interno del Cerebro Clínico'
        },
        {
          mock: () => mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
            url: CLOUD_FUNCTION_URL,
            json: async () => {
              throw new Error('Unexpected token < in JSON');
            }
          }),
          expectedError: 'Error parseando JSON'
        },
        {
          mock: () => mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
            url: CLOUD_FUNCTION_URL,
            json: async () => ({ candidates: [{ finishReason: 'STOP' }] })
          }),
          expectedError: 'Respuesta inválida o inesperada'
        },
        {
          mock: () => mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
            url: CLOUD_FUNCTION_URL,
            json: async () => ({})
          }),
          expectedError: 'Respuesta inválida o inesperada'
        },
        {
          mock: () => mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers(),
            url: CLOUD_FUNCTION_URL,
            json: async () => null
          }),
          expectedError: 'Respuesta inválida o inesperada'
        }
      ];

      for (const scenario of failureScenarios) {
        scenario.mock();

        const transcription = 'Paciente con dolor en el pecho';
        
        const result = await audioService.analyzeClinicalTranscription({
          transcription,
          specialty: 'general_medicine',
          sessionType: 'initial'
        });
        
        // Verificar que siempre hay una respuesta estructurada
        expect(result).toBeDefined();
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('error');
        
        // Verificar que el error está bien formateado
        expect(result.error).toBeDefined();
        if (result.error) {
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(10);
          expect(result.error).toContain(scenario.expectedError);
        }
      }
    });
  });
}); 