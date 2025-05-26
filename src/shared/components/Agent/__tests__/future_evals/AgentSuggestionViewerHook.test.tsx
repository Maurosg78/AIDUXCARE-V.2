import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useAgentSuggestionViewer } from '../AgentSuggestionViewerHook';
import { EMRFormService } from '@/services/EMRFormService';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { AuditLogger } from '@/services/AuditLogger';

// Mocks
jest.mock('@/services/EMRFormService');
jest.mock('@/services/UsageAnalyticsService');
jest.mock('@/services/AuditLogger');

describe('useAgentSuggestionViewer', () => {
  const mockProps = {
    visitId: 'visit-123',
    userId: 'user-123',
    patientId: 'patient-123'
  };

  const mockSuggestions = [
    {
      id: 'suggestion-1',
      type: 'recommendation' as const,
      content: 'Test suggestion 1',
      sourceBlockId: 'block-1',
      field: 'diagnosis'
    },
    {
      id: 'suggestion-2',
      type: 'warning' as const,
      content: 'Test suggestion 2',
      sourceBlockId: 'block-2',
      field: 'treatment'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe inicializar el estado correctamente', () => {
    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.integratedSuggestions).toEqual(new Set());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debe manejar la integración de sugerencias correctamente', async () => {
    const mockInsertSuggestion = jest.fn().mockResolvedValue(true);
    (EMRFormService.insertSuggestion as jest.Mock).mockImplementation(mockInsertSuggestion);

    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    await act(async () => {
      await result.current.handleSuggestionAccepted(mockSuggestions[0]);
    });

    expect(mockInsertSuggestion).toHaveBeenCalledWith(
      mockSuggestions[0],
      mockProps.visitId,
      mockProps.userId
    );
    expect(trackMetric).toHaveBeenCalledWith(
      'suggestions_integrated',
      {
        suggestionId: mockSuggestions[0].id,
        suggestionType: mockSuggestions[0].type,
        suggestionField: mockSuggestions[0].field
      },
      mockProps.userId,
      mockProps.visitId
    );
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integrated',
      {
        suggestionId: mockSuggestions[0].id,
        visitId: mockProps.visitId,
        userId: mockProps.userId
      }
    );
    expect(result.current.integratedSuggestions).toContain(mockSuggestions[0].id);
  });

  it('debe manejar el rechazo de sugerencias correctamente', async () => {
    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    await act(async () => {
      await result.current.handleSuggestionRejected(mockSuggestions[0]);
    });

    expect(trackMetric).toHaveBeenCalledWith(
      'suggestions_rejected',
      {
        suggestionId: mockSuggestions[0].id,
        suggestionType: mockSuggestions[0].type,
        suggestionField: mockSuggestions[0].field
      },
      mockProps.userId,
      mockProps.visitId
    );
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_rejected',
      {
        suggestionId: mockSuggestions[0].id,
        visitId: mockProps.visitId,
        userId: mockProps.userId
      }
    );
  });

  it('debe manejar errores de integración correctamente', async () => {
    const mockInsertSuggestion = jest.fn().mockRejectedValue(new Error('Error de integración'));
    (EMRFormService.insertSuggestion as jest.Mock).mockImplementation(mockInsertSuggestion);

    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    await act(async () => {
      await result.current.handleSuggestionAccepted(mockSuggestions[0]);
    });

    expect(result.current.error).toBe('Error al integrar la sugerencia');
  });

  it('debe manejar la carga de sugerencias correctamente', async () => {
    const mockGetSuggestions = jest.fn().mockResolvedValue(mockSuggestions);
    (EMRFormService.getSuggestions as jest.Mock).mockImplementation(mockGetSuggestions);

    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    await act(async () => {
      await result.current.loadSuggestions();
    });

    expect(mockGetSuggestions).toHaveBeenCalledWith(mockProps.visitId);
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.isLoading).toBe(false);
  });

  it('debe manejar errores de carga correctamente', async () => {
    const mockGetSuggestions = jest.fn().mockRejectedValue(new Error('Error de carga'));
    (EMRFormService.getSuggestions as jest.Mock).mockImplementation(mockGetSuggestions);

    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    await act(async () => {
      await result.current.loadSuggestions();
    });

    expect(result.current.error).toBe('Error al cargar las sugerencias');
    expect(result.current.isLoading).toBe(false);
  });

  it('debe limpiar el estado de error al cargar sugerencias', async () => {
    const mockGetSuggestions = jest.fn().mockResolvedValue(mockSuggestions);
    (EMRFormService.getSuggestions as jest.Mock).mockImplementation(mockGetSuggestions);

    const { result } = renderHook(() => useAgentSuggestionViewer(mockProps));

    await act(async () => {
      result.current.error = 'Error anterior';
      await result.current.loadSuggestions();
    });

    expect(result.current.error).toBeNull();
  });
}); 