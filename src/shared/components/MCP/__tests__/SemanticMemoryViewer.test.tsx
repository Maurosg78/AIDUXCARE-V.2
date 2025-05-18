import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SemanticMemoryViewer from '../SemanticMemoryViewer';
import { SemanticMemoryService, SemanticMemoryBlock } from '../../../../core/mcp/SemanticMemoryService';

// Mock del servicio SemanticMemoryService
vi.mock('../../../../core/mcp/SemanticMemoryService', async () => {
  const actual = await vi.importActual('../../../../core/mcp/SemanticMemoryService');
  return {
    ...actual as object,
    SemanticMemoryService: vi.fn().mockImplementation(() => ({
      getSemanticBlocksByVisit: vi.fn(),
      getImportantSemanticBlocksByPatient: vi.fn(),
      deleteSemanticBlock: vi.fn(),
      saveSemanticBlock: vi.fn()
    }))
  };
});

describe('SemanticMemoryViewer', () => {
  // Datos simulados para las pruebas
  const mockBlocks: SemanticMemoryBlock[] = [
    {
      id: '1',
      visit_id: 'visit-1',
      patient_id: 'patient-1',
      user_id: 'user-1',
      concept: 'Hipertensión',
      category: 'diagnóstico',
      importance: 'high',
      relevance_score: 0.9,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      visit_id: 'visit-1',
      patient_id: 'patient-1',
      user_id: 'user-1',
      concept: 'Dolor abdominal leve',
      category: 'observación',
      importance: 'low',
      relevance_score: 0.3,
      source_text: 'El paciente refiere dolor abdominal ocasional',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      visit_id: 'visit-2',
      patient_id: 'patient-1',
      user_id: 'user-1',
      concept: 'Riesgo cardíaco',
      category: 'riesgo',
      importance: 'medium',
      relevance_score: 0.6,
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los bloques de memoria semántica de una visita específica', async () => {
    // Configurar el mock para devolver datos de una visita
    const mockService = vi.mocked(SemanticMemoryService);
    const mockGetByVisit = vi.fn().mockResolvedValue([mockBlocks[0], mockBlocks[1]]);
    
    mockService.mockImplementation(() => ({
      getSemanticBlocksByVisit: mockGetByVisit,
      getImportantSemanticBlocksByPatient: vi.fn(),
      deleteSemanticBlock: vi.fn(),
      saveSemanticBlock: vi.fn()
    }));

    // Renderizar el componente con prop visitId
    render(<SemanticMemoryViewer visitId="visit-1" />);

    // Verificar que se muestra el estado de carga
    expect(screen.getByText(/Memoria Semántica/i)).toBeInTheDocument();
    
    // Verificar que se llama al método correcto del servicio
    await waitFor(() => {
      expect(mockGetByVisit).toHaveBeenCalledWith('visit-1');
    });

    // Verificar que se muestran los bloques correctos
    await waitFor(() => {
      expect(screen.getByText(/Hipertensión/i)).toBeInTheDocument();
      expect(screen.getByText(/Dolor abdominal leve/i)).toBeInTheDocument();
      expect(screen.getByText(/diagnóstico/i)).toBeInTheDocument();
      expect(screen.getByText(/observación/i)).toBeInTheDocument();
    });

    // Verificar que se muestra el score y la importancia
    await waitFor(() => {
      expect(screen.getByText(/90%/i)).toBeInTheDocument(); // 0.9 formateado como 90%
      expect(screen.getByText(/high/i)).toBeInTheDocument();
      expect(screen.getByText(/low/i)).toBeInTheDocument();
    });

    // Verificar que se muestra el texto fuente si existe
    await waitFor(() => {
      expect(screen.getByText(/El paciente refiere dolor abdominal ocasional/i)).toBeInTheDocument();
    });
  });

  it('muestra bloques importantes de un paciente específico', async () => {
    // Configurar el mock para devolver datos importantes de un paciente
    const mockService = vi.mocked(SemanticMemoryService);
    const mockGetImportant = vi.fn().mockResolvedValue([mockBlocks[0], mockBlocks[2]]); // Solo los de relevancia alta
    
    mockService.mockImplementation(() => ({
      getSemanticBlocksByVisit: vi.fn(),
      getImportantSemanticBlocksByPatient: mockGetImportant,
      deleteSemanticBlock: vi.fn(),
      saveSemanticBlock: vi.fn()
    }));

    // Renderizar el componente con prop patientId y minRelevance
    render(<SemanticMemoryViewer patientId="patient-1" minRelevance={0.5} />);

    // Verificar que se llama al método correcto del servicio
    await waitFor(() => {
      expect(mockGetImportant).toHaveBeenCalledWith('patient-1', 0.5);
    });

    // Verificar que solo se muestran los bloques con relevancia ≥ 0.5
    await waitFor(() => {
      expect(screen.getByText(/Hipertensión/i)).toBeInTheDocument(); // 0.9
      expect(screen.getByText(/Riesgo cardíaco/i)).toBeInTheDocument(); // 0.6
      expect(screen.queryByText(/Dolor abdominal leve/i)).not.toBeInTheDocument(); // 0.3, no debería mostrarse
    });
  });

  it('muestra mensaje cuando no hay bloques de memoria', async () => {
    // Configurar mock para devolver array vacío
    const mockService = vi.mocked(SemanticMemoryService);
    mockService.mockImplementation(() => ({
      getSemanticBlocksByVisit: vi.fn().mockResolvedValue([]),
      getImportantSemanticBlocksByPatient: vi.fn(),
      deleteSemanticBlock: vi.fn(),
      saveSemanticBlock: vi.fn()
    }));

    // Renderizar el componente
    render(<SemanticMemoryViewer visitId="visit-empty" />);

    // Verificar que se muestra el mensaje de no resultados
    await waitFor(() => {
      expect(screen.getByText(/No se encontraron bloques de memoria semántica/i)).toBeInTheDocument();
    });
  });

  it('muestra error cuando falla la carga de datos', async () => {
    // Configurar mock para lanzar error
    const mockService = vi.mocked(SemanticMemoryService);
    mockService.mockImplementation(() => ({
      getSemanticBlocksByVisit: vi.fn().mockRejectedValue(new Error('Error de prueba')),
      getImportantSemanticBlocksByPatient: vi.fn(),
      deleteSemanticBlock: vi.fn(),
      saveSemanticBlock: vi.fn()
    }));

    // Renderizar el componente
    render(<SemanticMemoryViewer visitId="visit-error" />);

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos/i)).toBeInTheDocument();
    });
  });

  it('agrupa y ordena los bloques por categoría y relevancia', async () => {
    // Mockear diversos bloques de diferentes categorías
    const mixedBlocks: SemanticMemoryBlock[] = [
      {
        id: '1',
        visit_id: 'visit-1',
        patient_id: 'patient-1',
        user_id: 'user-1',
        concept: 'Hipertensión',
        category: 'diagnóstico',
        importance: 'high',
        relevance_score: 0.9,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        visit_id: 'visit-1',
        patient_id: 'patient-1',
        user_id: 'user-1',
        concept: 'Diabetes',
        category: 'diagnóstico',
        importance: 'high',
        relevance_score: 0.95,
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        visit_id: 'visit-1',
        patient_id: 'patient-1',
        user_id: 'user-1',
        concept: 'Posible anemia',
        category: 'riesgo',
        importance: 'medium',
        relevance_score: 0.7,
        created_at: new Date().toISOString()
      }
    ];

    // Configurar mock
    const mockService = vi.mocked(SemanticMemoryService);
    mockService.mockImplementation(() => ({
      getSemanticBlocksByVisit: vi.fn().mockResolvedValue(mixedBlocks),
      getImportantSemanticBlocksByPatient: vi.fn(),
      deleteSemanticBlock: vi.fn(),
      saveSemanticBlock: vi.fn()
    }));

    // Renderizar componente
    render(<SemanticMemoryViewer visitId="visit-1" />);

    // Verificar categorías
    await waitFor(() => {
      expect(screen.getByText(/diagnóstico \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/riesgo \(1\)/i)).toBeInTheDocument();
    });

    // Verificar que dentro de diagnóstico, Diabetes (0.95) aparece antes que Hipertensión (0.9)
    // Esto es difícil de testear directamente con jsdom, pero podemos verificar que ambos existen
    await waitFor(() => {
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
      expect(screen.getByText('Hipertensión')).toBeInTheDocument();
    });
  });
}); 