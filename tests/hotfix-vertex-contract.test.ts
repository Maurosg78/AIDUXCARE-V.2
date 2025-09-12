import { describe, it, expect, vi } from 'vitest';
import { callVertexAI } from '../src/services/vertex-ai-service-firebase';
import { parseVertexResponse } from '../src/utils/responseParser';

// Mock de fetch
global.fetch = vi.fn();

describe('HOTFIX-0: Vertex Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callVertexAI', () => {
    it('debe devolver { text: string } cuando la respuesta trae .result', async () => {
      const mockResponse = {
        result: '{"motivo_consulta": "Dolor lumbar"}'
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await callVertexAI('test prompt');
      
      expect(result).toHaveProperty('text');
      expect(typeof result.text).toBe('string');
      expect(result.text).toBe('{"motivo_consulta": "Dolor lumbar"}');
    });

    it('debe extraer texto de estructura Vertex estándar', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: '{"motivo_consulta": "Dolor cervical"}'
            }]
          }
        }]
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await callVertexAI('test prompt');
      
      expect(result.text).toBe('{"motivo_consulta": "Dolor cervical"}');
      expect(result.vertexRaw).toEqual(mockResponse);
    });

    it('debe lanzar error si no hay texto', async () => {
      const mockResponse = {
        noText: 'empty'
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      await expect(callVertexAI('test prompt')).rejects.toThrow('VertexStd: empty text');
    });
  });

  describe('parseVertexResponse', () => {
    it('debe parsear objeto con .text correctamente', () => {
      const input = {
        text: '{"motivo_consulta": "Test", "hallazgos_clinicos": ["Item1"]}'
      };
      
      const result = parseVertexResponse(input);
      
      expect(result.success).toBe(true);
      expect(result.data.motivo_consulta).toBe('Test');
      expect(result.data.hallazgos_clinicos).toHaveLength(1);
    });

    it('debe parsear string directo', () => {
      const input = '{"motivo_consulta": "Dolor"}';
      
      const result = parseVertexResponse(input);
      
      expect(result.success).toBe(true);
      expect(result.data.motivo_consulta).toBe('Dolor');
    });

    it('debe remover markdown fences', () => {
      const input = '```json\n{"motivo_consulta": "Test"}\n```';
      
      const result = parseVertexResponse(input);
      
      expect(result.success).toBe(true);
      expect(result.data.motivo_consulta).toBe('Test');
    });

    it('debe reparar JSON truncado', () => {
      const input = {
        text: '{"motivo_consulta": "Test", "hallazgos_clinicos": ["Item1"'
      };
      
      const result = parseVertexResponse(input);
      
      expect(result.success).toBe(true);
      expect(result.data.motivo_consulta).toBe('Test');
    });

    it('debe devolver error sin excepción cuando no hay texto', () => {
      const input = {};
      
      const result = parseVertexResponse(input);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Respuesta vacía');
      expect(result.data).toBe(null);
    });
  });
});
