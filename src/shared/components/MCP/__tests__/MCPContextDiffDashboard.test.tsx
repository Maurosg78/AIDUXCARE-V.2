import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MCPContextDiffDashboard from '../MCPContextDiffDashboard';
import { MCPMemoryBlock } from '../../../../core/mcp/schema';
import { Visit, VisitStatus } from '../../../../core/domain/visitType';
import * as MCPDataSource from '../../../../core/mcp/MCPDataSourceSupabase';

// Mock de los datos y funciones
vi.mock('../../../../core/mcp/MCPDataSourceSupabase', () => ({
  getContextualMemory: vi.fn(),
  getPersistentMemory: vi.fn(),
  getSemanticMemory: vi.fn()
}));

describe('MCPContextDiffDashboard', () => {
  const mockVisits: Visit[] = [
    {
      id: 'visit-1',
      patient_id: 'patient-1',
      professional_id: 'prof-1',
      date: '2023-05-15T10:00:00Z',
      status: VisitStatus.COMPLETED,
      notes: 'Primera visita',
      created_at: '2023-05-15T10:00:00Z',
      updated_at: '2023-05-15T11:30:00Z'
    },
    {
      id: 'visit-2',
      patient_id: 'patient-1',
      professional_id: 'prof-1',
      date: '2023-06-20T14:00:00Z',
      status: VisitStatus.COMPLETED,
      notes: 'Segunda visita',
      created_at: '2023-06-20T14:00:00Z',
      updated_at: '2023-06-20T15:15:00Z'
    }
  ];

  // Bloques de memoria para pruebas
  const mockContextualBlocks1: MCPMemoryBlock[] = [
    {
      id: 'ctx-1',
      created_at: '2023-05-15T10:10:00Z',
      type: 'contextual',
      content: 'Información de la primera visita',
      visit_id: 'visit-1'
    }
  ];

  const mockContextualBlocks2: MCPMemoryBlock[] = [
    {
      id: 'ctx-1',
      created_at: '2023-06-20T14:10:00Z',
      type: 'contextual',
      content: 'Información actualizada de la primera visita',
      visit_id: 'visit-2'
    },
    {
      id: 'ctx-2',
      created_at: '2023-06-20T14:15:00Z',
      type: 'contextual',
      content: 'Nuevo bloque de información',
      visit_id: 'visit-2'
    }
  ];

  const mockPersistentBlocks: MCPMemoryBlock[] = [
    {
      id: 'pers-1',
      created_at: '2023-05-15T10:20:00Z',
      type: 'persistent',
      content: 'Información persistente del paciente',
      patient_id: 'patient-1'
    }
  ];

  const mockSemanticBlocks: MCPMemoryBlock[] = [
    {
      id: 'sem-1',
      created_at: '2023-01-01T00:00:00Z',
      type: 'semantic',
      content: 'Conocimiento médico general'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza correctamente con listado de visitas', () => {
    render(<MCPContextDiffDashboard visits={mockVisits} patientId="patient-1" />);
    
    // Verificar que los selectores de visitas están presentes
    expect(screen.getByText(/Comparador de Contexto MCP/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Visita actual/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Visita anterior/i)).toBeInTheDocument();
    
    // El mensaje inicial debe estar visible
    expect(screen.getByText(/Selecciona dos visitas para comparar/i)).toBeInTheDocument();
  });

  test('muestra las diferencias cuando se seleccionan dos visitas', async () => {
    // Configurar los mocks para devolver datos diferentes
    vi.mocked(MCPDataSource.getContextualMemory).mockImplementation((visitId: string) => {
      if (visitId === 'visit-1') return Promise.resolve(mockContextualBlocks1);
      if (visitId === 'visit-2') return Promise.resolve(mockContextualBlocks2);
      return Promise.resolve([]);
    });
    
    vi.mocked(MCPDataSource.getPersistentMemory).mockResolvedValue(mockPersistentBlocks);
    vi.mocked(MCPDataSource.getSemanticMemory).mockResolvedValue(mockSemanticBlocks);
    
    render(<MCPContextDiffDashboard visits={mockVisits} patientId="patient-1" />);
    
    // Seleccionar visitas
    const user = userEvent.setup();
    const currentVisitSelect = screen.getByLabelText(/Visita actual/i);
    const previousVisitSelect = screen.getByLabelText(/Visita anterior/i);
    
    // Primero seleccionar la visita actual
    await user.selectOptions(currentVisitSelect, 'visit-2');
    
    // Luego seleccionar la visita anterior
    await user.selectOptions(previousVisitSelect, 'visit-1');
    
    // Esperar a que se carguen los datos y se muestre la comparación
    await waitFor(() => {
      // Verificar que las estadísticas se muestran
      expect(screen.getByText(/Memoria Contextual/i)).toBeInTheDocument();
      
      // Verificar que se muestra un elemento modificado
      expect(screen.getByText(/modificado/i)).toBeInTheDocument();
      
      // Verificar que se muestra el contenido anterior y actual
      expect(screen.getByText(/Información de la primera visita/i)).toBeInTheDocument();
      expect(screen.getByText(/Información actualizada de la primera visita/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error cuando falla la carga de datos', async () => {
    // Simular un error en la carga de datos
    vi.mocked(MCPDataSource.getContextualMemory).mockRejectedValue(new Error('Error al cargar datos'));
    
    render(<MCPContextDiffDashboard visits={mockVisits} patientId="patient-1" />);
    
    // Seleccionar visitas
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/Visita actual/i), 'visit-2');
    await user.selectOptions(screen.getByLabelText(/Visita anterior/i), 'visit-1');
    
    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error al comparar contextos/i)).toBeInTheDocument();
    });
  });
}); 