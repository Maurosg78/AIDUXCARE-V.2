/* @ts-nocheck */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { routeQuery, runAssistantQuery } from '../assistantAdapter';

// Mock de Firebase Functions
const mockHttpsCallable = vi.fn();
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => mockHttpsCallable)
}));

// Mock de Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user-123' }
  }))
}));

// Mock de analytics
vi.mock('../../analytics/events', () => ({
  logAction: vi.fn()
}));

describe('AssistantAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpsCallable.mockReset();
  });

  describe('routeQuery', () => {
    it('debe detectar consultas de edad correctamente', () => {
      const result = routeQuery('¿Cuál es la edad del paciente?');
      
      expect(result.type).toBe('data');
      expect(result.dataIntent).toBe('age');
      expect(result.confidence).toBe(0.95);
    });

    it('debe detectar consultas de resonancia correctamente', () => {
      const result = routeQuery('¿Qué dice la última resonancia?');
      
      expect(result.type).toBe('data');
      expect(result.dataIntent).toBe('mri');
      expect(result.confidence).toBe(0.95);
    });

    it('debe detectar consultas de citas correctamente', () => {
      const result = routeQuery('¿Qué citas tengo hoy?');
      
      expect(result.type).toBe('data');
      expect(result.dataIntent).toBe('todayAppointments');
      expect(result.confidence).toBe(0.95);
    });

    it('debe detectar consultas de notas pendientes correctamente', () => {
      const result = routeQuery('¿Cuántas notas pendientes tengo?');
      
      expect(result.type).toBe('data');
      expect(result.dataIntent).toBe('pendingNotes');
      expect(result.confidence).toBe(0.95);
    });

    it('debe detectar consultas mixtas (datos + conocimiento)', () => {
      const result = routeQuery('¿Cuál es la edad del paciente y qué ejercicios recomiendas?');
      
      expect(result.type).toBe('both');
      expect(result.confidence).toBe(0.7);
    });

    it('debe detectar consultas de conocimiento clínico', () => {
      const result = routeQuery('¿Qué ejercicios son buenos para el dolor lumbar?');
      
      expect(result.type).toBe('llm');
      expect(result.confidence).toBe(0.8);
    });

    it('debe asignar confianza baja para consultas genéricas', () => {
      const result = routeQuery('¿Cómo estás?');
      
      expect(result.type).toBe('data');
      expect(result.confidence).toBe(0.3);
    });
  });

  describe('runAssistantQuery', () => {
    it('debe manejar consultas de datos correctamente', async () => {
      mockHttpsCallable.mockResolvedValue({
        data: {
          answerMarkdown: 'La edad del paciente es 35 años',
          data: { age: 35 }
        }
      });

      const result = await runAssistantQuery({
        input: '¿Cuál es la edad del paciente?',
        ctx: { patientId: 'patient-123' }
      });

      expect(result.ok).toBe(true);
      expect(result.routeType).toBe('data');
      expect(result.answerMarkdown).toBe('La edad del paciente es 35 años');
      expect(result.data).toEqual({ age: 35 });
      expect(result.confidence).toBe(0.95);
    });

    it('debe manejar consultas LLM correctamente', async () => {
      mockHttpsCallable.mockResolvedValue({
        data: {
          answerMarkdown: 'Para el dolor lumbar, recomiendo ejercicios de estabilización',
          entities: [{ kind: 'exercise', name: 'estabilización lumbar' }]
        }
      });

      const result = await runAssistantQuery({
        input: '¿Qué ejercicios para el dolor lumbar?'
      });

      expect(result.ok).toBe(true);
      expect(result.routeType).toBe('llm');
      expect(result.answerMarkdown).toBe('Para el dolor lumbar, recomiendo ejercicios de estabilización');
      expect(result.entities).toEqual([{ kind: 'exercise', name: 'estabilización lumbar' }]);
      expect(result.confidence).toBe(0.8);
    });

    it('debe manejar consultas mixtas correctamente', async () => {
      // Mock para consulta de datos
      mockHttpsCallable
        .mockResolvedValueOnce({
          data: {
            answerMarkdown: 'La edad del paciente es 45 años',
            data: { age: 45 }
          }
        })
        // Mock para consulta LLM
        .mockResolvedValueOnce({
          data: {
            answerMarkdown: 'Para su edad, recomiendo ejercicios de bajo impacto',
            entities: [{ kind: 'exercise', name: 'bajo impacto' }]
          }
        });

      const result = await runAssistantQuery({
        input: '¿Cuál es la edad del paciente y qué ejercicios recomiendas?',
        ctx: { patientId: 'patient-123' }
      });

      expect(result.ok).toBe(true);
      expect(result.routeType).toBe('both');
      expect(result.answerMarkdown).toContain('La edad del paciente es 45 años');
      expect(result.answerMarkdown).toContain('Para su edad, recomiendo ejercicios de bajo impacto');
      expect(result.confidence).toBe(0.7);
    });

    it('debe manejar errores correctamente', async () => {
      mockHttpsCallable.mockRejectedValue(new Error('Error de red'));

      const result = await runAssistantQuery({
        input: '¿Cuál es la edad del paciente?'
      });

      expect(result.ok).toBe(false);
      expect(result.error).toBe('Error de red');
      expect(result.confidence).toBe(0);
    });
  });
});
