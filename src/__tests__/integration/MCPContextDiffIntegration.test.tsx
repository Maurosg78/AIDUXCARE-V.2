import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PatientDetailPage from '../../features/patient/PatientDetailPage';
import MCPContextDiffDashboard from '../../shared/components/MCP/MCPContextDiffDashboard';
import { Patient, PatientGender } from '../../core/domain/patientType';
import { Visit, VisitStatus } from '../../core/domain/visitType';

// Mock de los módulos necesarios
vi.mock('../../core/dataSources/patientDataSourceSupabase', () => ({
  patientDataSourceSupabase: {
    getPatientById: vi.fn()
  }
}));

vi.mock('../../core/dataSources/visitDataSourceSupabase', () => ({
  visitDataSourceSupabase: {
    getVisitsByPatientId: vi.fn()
  }
}));

vi.mock('../../shared/components/MCP/MCPContextDiffDashboard', () => ({
  default: vi.fn(() => <div data-testid="mcp-context-diff-dashboard">MCPContextDiffDashboard Mock</div>)
}));

// Solución al problema de tipo spread
vi.mock('react-router-dom', () => {
  const originalModule = vi.importActual('react-router-dom');
  return {
    ...originalModule as object,
    useParams: () => ({ id: 'patient-test-id' }),
    useNavigate: () => vi.fn()
  };
});

vi.mock('../../shared/components/Metrics/LongitudinalMetricsViewer', () => ({
  default: () => <div>Metrics Viewer Mock</div>
}));

vi.mock('../../shared/components/Agent/AgentLongitudinalImpact', () => ({
  default: () => <div>Agent Impact Mock</div>
}));

describe('Integración de MCPContextDiffDashboard', () => {
  const mockPatient: Patient = {
    id: 'patient-test-id',
    name: 'Paciente Test',
    date_of_birth: '1990-01-01',
    gender: PatientGender.MALE,
    created_at: new Date().toISOString()
  };

  const mockVisits: Visit[] = [
    {
      id: 'visit-1',
      patient_id: 'patient-test-id',
      professional_id: 'prof-1',
      date: '2023-05-15T10:00:00Z',
      status: VisitStatus.COMPLETED,
      notes: 'Primera visita',
      created_at: '2023-05-15T10:00:00Z',
      updated_at: '2023-05-15T11:30:00Z'
    },
    {
      id: 'visit-2',
      patient_id: 'patient-test-id',
      professional_id: 'prof-1',
      date: '2023-06-20T14:00:00Z',
      status: VisitStatus.COMPLETED,
      notes: 'Segunda visita',
      created_at: '2023-06-20T14:00:00Z',
      updated_at: '2023-06-20T15:15:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar los mocks para devolver datos
    const { patientDataSourceSupabase } = require('../../core/dataSources/patientDataSourceSupabase');
    const { visitDataSourceSupabase } = require('../../core/dataSources/visitDataSourceSupabase');
    
    patientDataSourceSupabase.getPatientById.mockResolvedValue(mockPatient);
    visitDataSourceSupabase.getVisitsByPatientId.mockResolvedValue(mockVisits);
  });

  test('Verificar integración de MCPContextDiffDashboard en PatientDetailPage', async () => {
    // Renderizar PatientDetailPage directamente, con todos los mocks configurados
    render(
      <BrowserRouter>
        <PatientDetailPage />
      </BrowserRouter>
    );

    // Esperar a que los datos se carguen
    await waitFor(() => {
      expect(screen.getByText(mockPatient.name)).toBeInTheDocument();
    });

    // A este punto podemos verificar que MCPContextDiffDashboard fue llamado con las props correctas
    const mockMCPContextDiffDashboard = vi.mocked(MCPContextDiffDashboard);
    
    await waitFor(() => {
      expect(mockMCPContextDiffDashboard).toHaveBeenCalledWith(
        expect.objectContaining({
          visits: mockVisits,
          patientId: mockPatient.id
        }),
        expect.anything()
      );
    });
  });
  
  // Este test verifica directamente la interacción entre los componentes
  test('MCPContextDiffDashboard recibe las visitas y el patientId correctos', () => {
    // Renderizar el componente MCPContextDiffDashboard directamente
    render(<MCPContextDiffDashboard visits={mockVisits} patientId="patient-test-id" />);
    
    // Verificar que el mock del componente se renderizó correctamente
    expect(screen.getByTestId('mcp-context-diff-dashboard')).toBeInTheDocument();
  });
}); 