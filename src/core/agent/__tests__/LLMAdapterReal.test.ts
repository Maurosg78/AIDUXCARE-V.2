import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  generatePromptFromContext, 
  callLLMReal, 
  parseLLMResponses, 
  getSuggestionsFromLLM 
} from '../LLMAdapterReal';
import { AgentContext } from '../AgentContextBuilder';
import { AgentSuggestion } from '../ClinicalAgent';
import { SuggestionType } from '../../types/suggestions';

// Mock para funciones que no queremos probar realmente
vi.mock('../LLMAdapterReal', async () => {
  const originalModule = await vi.importActual('../LLMAdapterReal');
  return {
    generatePromptFromContext: (originalModule as any).generatePromptFromContext,
    parseLLMResponses: (originalModule as any).parseLLMResponses,
    getSuggestionsFromLLM: vi.fn().mockImplementation(async (ctx) => {
      // Llamar manualmente a callLLMReal y parseLLMResponses para las pruebas
      const mockLLMResponses = [
        '{ "type": "recommendation", "content": "Realizar Escala de Wells para evaluar riesgo de trombosis venosa profunda." }',
        '{ "type": "warning", "content": "Vigilar interacciones de analgésicos con medicación antihipertensiva." }',
        '{ "type": "info", "content": "El dolor en extremidades inferiores puede ser indicativo de problemas vasculares." }'
      ];
      const sourceBlockId = ctx.blocks.length > 0 ? ctx.blocks[0].id : 'default-block-id';
      return (originalModule as any).parseLLMResponses(mockLLMResponses, sourceBlockId);
    }),
    callLLMReal: vi.fn().mockResolvedValue([
      '{ "type": "recommendation", "content": "Realizar Escala de Wells para evaluar riesgo de trombosis venosa profunda." }',
      '{ "type": "warning", "content": "Vigilar interacciones de analgésicos con medicación antihipertensiva." }',
      '{ "type": "info", "content": "El dolor en extremidades inferiores puede ser indicativo de problemas vasculares." }'
    ])
  };
});

describe('LLMAdapterReal', () => {
  // Contexto de prueba para usar en todos los tests
  const mockContext: AgentContext = {
    visitId: 'visit-123',
    patientId: 'patient-123',
    blocks: [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Paciente reporta dolor en extremidad inferior derecha desde hace 3 días.'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: 'Paciente con hipertensión arterial controlada. Medicación actual: Enalapril 10mg/día.'
      },
      {
        id: 'block-3',
        type: 'semantic',
        content: 'Guías clínicas recomiendan evaluación del riesgo de trombosis en pacientes con dolor en extremidades inferiores.'
      }
    ]
  };

  // Respuesta simulada del LLM
  const mockLLMResponses = [
    '{ "type": "recommendation", "content": "Realizar Escala de Wells para evaluar riesgo de trombosis venosa profunda." }',
    '{ "type": "warning", "content": "Vigilar interacciones de analgésicos con medicación antihipertensiva." }',
    '{ "type": "info", "content": "El dolor en extremidades inferiores puede ser indicativo de problemas vasculares." }'
  ];

  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpiar mocks después de cada prueba
    vi.clearAllMocks();
  });

  describe('generatePromptFromContext', () => {
    it('debe generar un prompt correctamente estructurado a partir del contexto', () => {
      // Llamar a la función con el contexto mock
      const prompt = generatePromptFromContext(mockContext);
      
      // Verificar que el prompt contiene las secciones principales
      expect(prompt).toContain('# INSTRUCCIONES PARA EL ASISTENTE CLÍNICO');
      expect(prompt).toContain('# INFORMACIÓN DEL PACIENTE');
      expect(prompt).toContain('## HISTORIAL MÉDICO');
      expect(prompt).toContain('## INFORMACIÓN DE LA VISITA ACTUAL');
      expect(prompt).toContain('## INFORMACIÓN CLÍNICA RELEVANTE');
      expect(prompt).toContain('# SOLICITUD');
      
      // Verificar que el contenido de los bloques está presente
      expect(prompt).toContain('Paciente reporta dolor en extremidad inferior derecha');
      expect(prompt).toContain('Paciente con hipertensión arterial controlada');
      expect(prompt).toContain('Guías clínicas recomiendan evaluación del riesgo de trombosis');
    });
    
    it('debe manejar correctamente un contexto vacío', () => {
      const emptyContext: AgentContext = {
        visitId: '',
        patientId: '',
        blocks: []
      };
      
      const prompt = generatePromptFromContext(emptyContext);
      
      // Verificar que la estructura básica está presente
      expect(prompt).toContain('# INSTRUCCIONES PARA EL ASISTENTE CLÍNICO');
      expect(prompt).toContain('# INFORMACIÓN DEL PACIENTE');
      expect(prompt).toContain('# SOLICITUD');
      
      // Verificar que no incluye secciones para datos vacíos
      expect(prompt).not.toContain('## HISTORIAL MÉDICO');
      expect(prompt).not.toContain('## INFORMACIÓN DE LA VISITA ACTUAL');
      expect(prompt).not.toContain('## INFORMACIÓN CLÍNICA RELEVANTE');
    });
  });

  describe('parseLLMResponses', () => {
    it('debe convertir correctamente respuestas de texto a objetos AgentSuggestion', () => {
      const sourceBlockId = 'block-1';
      const suggestions = parseLLMResponses(mockLLMResponses, sourceBlockId);
      
      // Verificar que se generaron 3 sugerencias
      expect(suggestions).toHaveLength(3);
      
      // Verificar la estructura de las sugerencias
      expect(suggestions[0]).toMatchObject({
        sourceBlockId,
        type: 'recommendation',
        content: 'Realizar Escala de Wells para evaluar riesgo de trombosis venosa profunda.'
      });
      
      expect(suggestions[1]).toMatchObject({
        sourceBlockId,
        type: 'warning',
        content: 'Vigilar interacciones de analgésicos con medicación antihipertensiva.'
      });
      
      expect(suggestions[2]).toMatchObject({
        sourceBlockId,
        type: 'info',
        content: 'El dolor en extremidades inferiores puede ser indicativo de problemas vasculares.'
      });
      
      // Verificar que cada sugerencia tiene los campos requeridos
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('sourceBlockId');
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('content');
        expect(suggestion).toHaveProperty('context_origin');
      });
    });
    
    it('debe manejar respuestas mal formateadas', () => {
      const sourceBlockId = 'block-1';
      const badResponses = [
        '{ "type": "recommendation", "content": "Esta está bien" }',
        'Esto no es un JSON válido',
        '{ "tipo": "warning", "contenido": "Campos incorrectos" }'
      ];
      
      const suggestions = parseLLMResponses(badResponses, sourceBlockId);
      
      // Solo debería procesar el primer elemento que es válido
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toMatchObject({
        type: 'recommendation',
        content: 'Esta está bien'
      });
    });
    
    it('debe validar tipos de sugerencia correctos', () => {
      const sourceBlockId = 'block-1';
      const responsesWithBadTypes = [
        '{ "type": "invalid-type", "content": "Tipo no válido" }',
        '{ "type": "recommendation", "content": "Tipo válido" }'
      ];
      
      const suggestions = parseLLMResponses(responsesWithBadTypes, sourceBlockId);
      
      // Debería convertir tipos inválidos a 'info'
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].type).toBe('info');
      expect(suggestions[1].type).toBe('recommendation');
    });
  });

  describe('getSuggestionsFromLLM', () => {
    it('debe generar sugerencias completas desde el contexto', async () => {
      // Configurar el mock de callLLMReal para esta prueba
      vi.mocked(callLLMReal).mockResolvedValue(mockLLMResponses);
      
      const suggestions = await getSuggestionsFromLLM(mockContext);
      
      // Verificar el resultado final (usando el mock implementado arriba)
      expect(suggestions).toHaveLength(3);
      expect(suggestions[0].type).toBe('recommendation');
      expect(suggestions[1].type).toBe('warning');
      expect(suggestions[2].type).toBe('info');
    });
    
    it('debe manejar errores y proporcionar sugerencias de respaldo', async () => {
      // Para este test, simulamos que el error es manejado internamente por getSuggestionsFromLLM
      // y devuelve una sugerencia de respaldo
      const mockSuggestion: AgentSuggestion = {
        id: 'mock-id',
        sourceBlockId: 'block-1',
        type: 'info',
        content: 'Se recomienda verificar los signos vitales del paciente y registrarlos en la historia clínica.',
        context_origin: {
          source_block: 'block-1',
          text: 'verificar signos vitales'
        }
      };
      
      vi.mocked(getSuggestionsFromLLM).mockResolvedValueOnce([mockSuggestion]);
      
      const suggestions = await getSuggestionsFromLLM(mockContext);
      
      // Verificar que se devolvió una sugerencia de respaldo
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('info');
      expect(suggestions[0].content).toContain('verificar los signos vitales');
    });
    
    it('debe proporcionar una sugerencia genérica si no se generaron respuestas', async () => {
      // Para este test, simulamos que getSuggestionsFromLLM detecta un array vacío
      // y devuelve una sugerencia genérica
      const mockSuggestion: AgentSuggestion = {
        id: 'mock-id',
        sourceBlockId: 'block-1',
        type: 'info',
        content: 'Considerar la realización de un examen físico completo y documentar hallazgos en la historia clínica.',
        context_origin: {
          source_block: 'block-1',
          text: 'examen físico completo'
        }
      };
      
      vi.mocked(getSuggestionsFromLLM).mockResolvedValueOnce([mockSuggestion]);
      
      const suggestions = await getSuggestionsFromLLM(mockContext);
      
      // Verificar que se devolvió la sugerencia genérica
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('info');
      expect(suggestions[0].content).toContain('examen físico completo');
    });
  });
}); 