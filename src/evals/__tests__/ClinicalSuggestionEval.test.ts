import { describe, it, expect } from 'vitest';
import { evaluateSuggestion, SuggestionEvalResult } from '../../evals/ClinicalSuggestionEval';
import { AgentSuggestion } from '../../core/agent/ClinicalAgent';
import { v4 as uuidv4 } from 'uuid';

describe('ClinicalSuggestionEval', () => {
  // Sugerencia válida para usar en los tests
  const validSuggestion: AgentSuggestion = {
    id: uuidv4(),
    sourceBlockId: 'block-123',
    type: 'recommendation',
    content: 'Administrar analgésicos según protocolo de dolor.',
    context_origin: {
      source_block: 'block-123',
      text: 'dolor'
    }
  };

  describe('evaluateSuggestion', () => {
    it('debe validar correctamente una sugerencia completa y válida', () => {
      // Evaluar una sugerencia válida
      const result = evaluateSuggestion(validSuggestion);

      // Verificar resultado
      expect(result.isValid).toBe(true);
      expect(result.reasons).toContain('Tipo de sugerencia \'recommendation\' válido.');
      expect(result.reasons).toContain(`Contenido de la sugerencia válido (${validSuggestion.content.length} caracteres).`);
      expect(result.reasons).toContain('Origen de contexto (context_origin) válido.');
      expect(result.reasons).toContain('ID de sugerencia válido.');
      expect(result.reasons).toContain('ID de bloque de origen (sourceBlockId) válido.');
    });

    it('debe detectar una sugerencia sin contenido', () => {
      // Crear una sugerencia sin contenido
      const suggestionWithoutContent: AgentSuggestion = {
        ...validSuggestion,
        content: ''
      };

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithoutContent);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('El contenido de la sugerencia no puede estar vacío.');
    });

    it('debe detectar una sugerencia con contenido demasiado corto', () => {
      // Crear una sugerencia con contenido demasiado corto
      const suggestionWithShortContent: AgentSuggestion = {
        ...validSuggestion,
        content: 'Corto'
      };

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithShortContent);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(`El contenido de la sugerencia es demasiado corto (${suggestionWithShortContent.content.length} caracteres). Mínimo requerido: 10 caracteres.`);
    });

    it('debe detectar una sugerencia sin context_origin', () => {
      // Crear una sugerencia sin context_origin
      const suggestionWithoutContext: AgentSuggestion = {
        id: uuidv4(),
        sourceBlockId: 'block-123',
        type: 'recommendation',
        content: 'Administrar analgésicos según protocolo de dolor.'
      };

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithoutContext);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('La sugerencia debe tener un origen de contexto definido (context_origin).');
    });

    it('debe detectar una sugerencia con tipo inválido', () => {
      // Crear una sugerencia con tipo inválido
      // Usamos unknown como paso intermedio para evitar el error de tipo
      const suggestionBase = { ...validSuggestion };
      const suggestionWithInvalidType = {
        ...suggestionBase,
        type: 'invalid-type' as 'recommendation' | 'warning' | 'info'
      };

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithInvalidType);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain(`Tipo de sugerencia 'invalid-type' no válido. Debe ser: recommendation, warning o info.`);
    });

    it('debe detectar una sugerencia sin ID', () => {
      // Crear una sugerencia sin ID
      const suggestionWithoutId = { ...validSuggestion } as AgentSuggestion;
      delete (suggestionWithoutId as any).id;

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithoutId);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('La sugerencia debe tener un ID único.');
    });

    it('debe detectar una sugerencia sin sourceBlockId', () => {
      // Crear una sugerencia sin sourceBlockId
      const suggestionWithoutSourceBlockId = { ...validSuggestion } as AgentSuggestion;
      delete (suggestionWithoutSourceBlockId as any).sourceBlockId;

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithoutSourceBlockId);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('La sugerencia debe tener un ID de bloque de origen (sourceBlockId).');
    });

    it('debe detectar una sugerencia con context_origin incompleto', () => {
      // Crear una sugerencia con context_origin incompleto
      const suggestionWithIncompleteContext: AgentSuggestion = {
        ...validSuggestion,
        context_origin: {
          source_block: 'block-123',
          text: ''
        }
      };

      // Evaluar la sugerencia
      const result = evaluateSuggestion(suggestionWithIncompleteContext);

      // Verificar resultado
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContain('El origen de contexto debe especificar un texto de referencia (text).');
    });
  });
}); 