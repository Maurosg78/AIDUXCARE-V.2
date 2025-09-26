import { describe, it, expect } from 'vitest';

import { sanitizeForLLM, validateClinicalQuery, getClinicalConfidence } from '../rails';

describe('RAILS System', () => {
  describe('sanitizeForLLM', () => {
    it('debe sanitizar PII correctamente', () => {
      const input = 'Paciente con DNI 12345678A y teléfono 612345678, email paciente@test.com';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('Paciente con DNI [DNI] y teléfono [TELÉFONO], email [EMAIL]');
    });

    it('debe sanitizar fechas correctamente', () => {
      const input = 'Consulta del 15/12/2024 y 20-01-2025';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('Consulta del [FECHA] y [FECHA]');
    });

    it('debe sanitizar pasaportes españoles', () => {
      const input = 'Paciente con pasaporte ES12345678A';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('Paciente con pasaporte [PASAPORTE]');
    });

    it('debe sanitizar NIEs', () => {
      const input = 'Paciente con NIE X1234567A';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('Paciente con NIE [NIE]');
    });

    it('debe rechazar consultas fuera del dominio médico', () => {
      const input = '¿Cuánto cuesta la consulta? Necesito factura';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('NO_ANSWER: Consulta fuera del dominio médico');
    });

    it('debe rechazar consultas de marketing', () => {
      const input = '¿Pueden hacer publicidad de sus servicios?';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('NO_ANSWER: Consulta fuera del dominio médico');
    });

    it('debe aceptar consultas médicas válidas', () => {
      const input = '¿Qué ejercicios son buenos para el dolor lumbar?';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('¿Qué ejercicios son buenos para el dolor lumbar?');
    });

    it('debe aceptar consultas de fisioterapia', () => {
      const input = '¿Cuál es la técnica correcta para la terapia manual?';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('¿Cuál es la técnica correcta para la terapia manual?');
    });

    it('debe rechazar consultas demasiado genéricas', () => {
      const input = 'Hola';
      const result = sanitizeForLLM(input);
      
      expect(result).toBe('NO_ANSWER: Consulta demasiado genérica. Por favor, sé más específico.');
    });

    it('debe manejar contexto de paciente correctamente', () => {
      const input = 'Este paciente tiene dolor en la rodilla';
      const result = sanitizeForLLM(input, { patientId: 'patient-123' });
      
      expect(result).toBe('[PACIENTE] tiene dolor en la rodilla');
    });
  });

  describe('validateClinicalQuery', () => {
    it('debe validar consultas médicas válidas', () => {
      const input = '¿Qué ejercicios para rehabilitación de hombro?';
      const result = validateClinicalQuery(input);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('¿Qué ejercicios para rehabilitación de hombro?');
    });

    it('debe rechazar consultas no médicas', () => {
      const input = '¿Cuál es el precio de la consulta?';
      const result = validateClinicalQuery(input);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Consulta fuera del dominio médico');
    });

    it('debe rechazar consultas genéricas', () => {
      const input = 'Hola, ¿cómo estás?';
      const result = validateClinicalQuery(input);
      
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Consulta demasiado genérica. Por favor, sé más específico.');
    });

    it('debe validar consultas con PII sanitizada', () => {
      const input = 'Paciente con DNI 12345678A tiene dolor lumbar';
      const result = validateClinicalQuery(input);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('Paciente con DNI [DNI] tiene dolor lumbar');
    });
  });

  describe('getClinicalConfidence', () => {
    it('debe asignar alta confianza para consultas técnicas', () => {
      const input = '¿Cuál es la técnica de manipulación vertebral para cervicalgia?';
      const confidence = getClinicalConfidence(input);
      
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('debe asignar alta confianza para consultas de fisioterapia', () => {
      const input = '¿Qué ejercicios de estabilización lumbar son recomendados?';
      const confidence = getClinicalConfidence(input);
      
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('debe asignar confianza media para consultas generales', () => {
      const input = '¿Qué es el dolor lumbar?';
      const confidence = getClinicalConfidence(input);
      
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThan(0.8);
    });

    it('debe reducir confianza para consultas genéricas', () => {
      const input = '¿Qué me recomiendas?';
      const confidence = getClinicalConfidence(input);
      
      expect(confidence).toBeLessThan(0.6);
    });

    it('debe incrementar confianza por palabras clave técnicas', () => {
      const input = '¿Cuál es el protocolo de rehabilitación post-ACL con biomecánica avanzada?';
      const confidence = getClinicalConfidence(input);
      
      expect(confidence).toBeGreaterThan(0.9);
    });

    it('debe manejar consultas mixtas correctamente', () => {
      const input = '¿Cuál es la edad del paciente y qué ejercicios de rehabilitación recomiendas?';
      const confidence = getClinicalConfidence(input);
      
      expect(confidence).toBeGreaterThan(0.6);
      expect(confidence).toBeLessThan(0.9);
    });
  });

  describe('Integración RAILS', () => {
    it('debe procesar consulta completa correctamente', () => {
      const input = 'Paciente con DNI 12345678A tiene dolor lumbar severo, ¿qué ejercicios de rehabilitación recomiendas?';
      
      // 1. Sanitización
      const sanitized = sanitizeForLLM(input);
      expect(sanitized).toBe('Paciente con DNI [DNI] tiene dolor lumbar severo, ¿qué ejercicios de rehabilitación recomiendas?');
      
      // 2. Validación
      const validation = validateClinicalQuery(sanitized);
      expect(validation.isValid).toBe(true);
      
      // 3. Confianza
      const confidence = getClinicalConfidence(sanitized);
      expect(confidence).toBeGreaterThan(0.7);
    });

    it('debe rechazar consulta no médica completamente', () => {
      const input = '¿Cuánto cuesta la consulta? Necesito factura para impuestos';
      
      // 1. Sanitización
      const sanitized = sanitizeForLLM(input);
      expect(sanitized).toBe('NO_ANSWER: Consulta fuera del dominio médico');
      
      // 2. Validación
      const validation = validateClinicalQuery(input);
      expect(validation.isValid).toBe(false);
      
      // 3. Confianza
      const confidence = getClinicalConfidence(input);
      expect(confidence).toBeLessThan(0.5);
    });
  });
});
