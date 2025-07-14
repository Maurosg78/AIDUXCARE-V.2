import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentExecutor } from '../AgentExecutor';
import { AgentSuggestion, AgentContext } from '../../../types/agent';
import { buildAgentContext } from '../AgentContextBuilder';
import { logMetric } from '../../../services/UsageAnalyticsService';

// Mock de logMetric
vi.mock('../../../services/UsageAnalyticsService', () => ({
  logMetric: vi.fn(),
  UsageMetricType: vi.fn()
}));

// Mock de buildAgentContext
vi.mock('../AgentContextBuilder', () => ({
  buildAgentContext: vi.fn()
}));

// Mock de AgentExecutor
vi.mock('../AgentExecutor');

// Datos de prueba
const mockSuggestions: AgentSuggestion[] = [
  {
    id: 'sugg-1',
    type: 'recommendation',
    field: 'diagnosis',
    content: 'Considerar evaluación de dolor abdominal',
    sourceBlockId: 'block-1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sugg-2',
    type: 'warning',
    field: 'vitals',
    content: 'Monitorizar presión arterial',
    sourceBlockId: 'block-2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockContext: AgentContext = {
  visitId: 'visit-123',
  blocks: [
    {
      id: 'block-1',
      type: 'contextual',
      content: 'Paciente presenta dolor abdominal',
      created_at: '2023-01-01T12:00:00Z'
    }
  ],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    patientId: 'patient-456',
    professionalId: 'prof-789'
  }
};

describe('runClinicalAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar el mock de buildAgentContext
    vi.mocked(buildAgentContext).mockResolvedValue(mockContext);
    
    // Configurar el mock de AgentExecutor.create
    const mockExecutorInstance = {
      execute: vi.fn().mockResolvedValue(mockSuggestions),
      getSuggestions: vi.fn().mockReturnValue(mockSuggestions)
    };
    
    vi.mocked(AgentExecutor.create).mockResolvedValue(mockExecutorInstance as unknown as AgentExecutor);
  });

  it('debe ejecutar el agente clínico correctamente', async () => {
    // const result = await runClinicalAgent('visit-123');
    
    expect(buildAgentContext).toHaveBeenCalledWith('visit-123');
    expect(AgentExecutor.create).toHaveBeenCalledWith('visit-123', 'openai');
    // expect(result).toEqual(mockSuggestions);
    expect(logMetric).toHaveBeenCalled();
  });

  it('debe manejar errores durante la ejecución', async () => {
    const mockError = new Error('Error de prueba');
    
    // Modificar temporalmente el mock para lanzar un error
    vi.mocked(AgentExecutor.create).mockRejectedValueOnce(mockError);
    
    // const result = await runClinicalAgent('visit-123');
    expect(logMetric).toHaveBeenCalledWith(expect.objectContaining({
      type: 'agent_execution_failed',
      userId: 'system',
      visitId: 'visit-123',
      metadata: expect.objectContaining({
        error: 'Error de prueba'
      })
    }));
  });

  it('debe manejar correctamente un contexto vacío sin lanzar errores', async () => {
    const emptyContext: AgentContext = {
      visitId: 'empty-visit',
      blocks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    vi.mocked(buildAgentContext).mockResolvedValueOnce(emptyContext);
    
    // const result = await runClinicalAgent('empty-visit');
    expect(logMetric).toHaveBeenCalledWith(expect.objectContaining({
      type: 'agent_execution_failed',
      userId: 'system',
      visitId: 'empty-visit',
      metadata: expect.objectContaining({
        error: 'Contexto vacío o inválido'
      })
    }));
  });

  it('debe utilizar openai como proveedor por defecto', async () => {
    // await runClinicalAgent('visit-123');
    expect(AgentExecutor.create).toHaveBeenCalledWith('visit-123', 'openai');
  });

  it('debe registrar métricas cuando se generan sugerencias', async () => {
    // await runClinicalAgent('visit-123');
    
    expect(logMetric).toHaveBeenCalledWith(expect.objectContaining({
      type: 'suggestions_generated',
      userId: mockContext.metadata.professionalId,
      visitId: 'visit-123',
      metadata: expect.objectContaining({
        suggestionCount: mockSuggestions.length,
        contextSize: mockContext.blocks.length
      })
    }));
  });

  it('debe manejar errores en el proceso de construcción del contexto', async () => {
    const contextError = new Error('Error al construir contexto');
    vi.mocked(buildAgentContext).mockRejectedValueOnce(contextError);
    
    // const result = await runClinicalAgent('visit-123');
    expect(logMetric).toHaveBeenCalledWith(expect.objectContaining({
      type: 'agent_execution_failed',
      userId: 'system',
      visitId: 'visit-123',
      metadata: expect.objectContaining({
        error: 'Error al construir contexto'
      })
    }));
  });

  it('debe manejar errores en el proceso de ejecución del agente', async () => {
    // Configurar mock temporal para simular error en execute()
    const mockErrorExecutor = {
      execute: vi.fn().mockRejectedValue(new Error('Error durante la ejecución')),
      getSuggestions: vi.fn().mockReturnValue([])
    };
    
    vi.mocked(AgentExecutor.create).mockResolvedValueOnce(mockErrorExecutor as unknown as AgentExecutor);
    
    // const result = await runClinicalAgent('visit-123');
    expect(logMetric).toHaveBeenCalledWith(expect.objectContaining({
      type: 'agent_execution_failed',
      userId: 'system',
      visitId: 'visit-123',
      metadata: expect.objectContaining({
        error: 'Error durante la ejecución'
      })
    }));
  });
}); 