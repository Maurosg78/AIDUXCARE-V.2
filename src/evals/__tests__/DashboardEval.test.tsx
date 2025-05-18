import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../../features/dashboard/DashboardPage';
import { useUser } from '../../core/auth/UserContext';
import { visitDataSourceSupabase } from '../../core/dataSources/visitDataSourceSupabase';
import { checkSupabaseConnection, isSupabaseConfigured } from '../../core/auth/supabaseClient';
import { SemanticMemoryService } from '../../core/mcp/SemanticMemoryService';

// Mock de useUser
vi.mock('../../core/auth/UserContext', () => ({
  useUser: vi.fn()
}));

// Mock del cliente de Supabase
vi.mock('../../core/auth/supabaseClient', () => ({
  default: {},
  checkSupabaseConnection: vi.fn(),
  isSupabaseConfigured: true
}));

// Mock del servicio de memoria semántica
vi.mock('../../core/mcp/SemanticMemoryService', () => ({
  SemanticMemoryService: vi.fn()
}));

// Mock de servicios
vi.mock('../../core/dataSources/visitDataSourceSupabase', () => ({
  visitDataSourceSupabase: {
    getVisitsByProfessionalId: vi.fn()
  }
}));

vi.mock('../../features/dashboard/dashboardServices', () => ({
  getProfessionalActivitySummary: vi.fn().mockResolvedValue({
    totalVisits: 5,
    suggestionsGenerated: 10,
    suggestionsAccepted: 8,
    suggestionsIntegrated: 6,
    timeSavedMinutes: 45
  }),
  getWeeklyMetrics: vi.fn().mockResolvedValue([
    { week: 'Semana 1', visits: 1, suggestionsGenerated: 2, suggestionsAccepted: 1 },
    { week: 'Semana 2', visits: 2, suggestionsGenerated: 4, suggestionsAccepted: 3 }
  ]),
  getLongitudinalMetricsByProfessional: vi.fn().mockResolvedValue([])
}));

vi.mock('../../features/dashboard/DashboardSemanticMemoryPanel', () => ({
  default: (props: { userId: string; lastVisitedPatientId?: string }) => (
    <div data-testid="dashboard-semantic-memory">
      Memory Panel Mock for {props.userId}
      {props.lastVisitedPatientId && <span>Patient: {props.lastVisitedPatientId}</span>}
    </div>
  )
}));

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de SemanticMemoryService
    (SemanticMemoryService as unknown as Mock).mockImplementation(() => ({
      getImportantSemanticBlocksByPatient: vi.fn().mockResolvedValue([
        {
          id: 'block-1',
          visit_id: 'visit-1',
          category: 'Diagnóstico',
          concept: 'Hipertensión',
          importance: 'high',
          relevance_score: 0.85,
          source_text: 'El paciente presenta hipertensión arterial',
          created_at: '2023-01-01T12:00:00Z'
        },
        {
          id: 'block-2',
          visit_id: 'visit-1',
          category: 'Observación',
          concept: 'Presión arterial',
          importance: 'medium',
          relevance_score: 0.75,
          source_text: 'Presión arterial 140/90 mmHg',
          created_at: '2023-01-01T12:00:00Z'
        }
      ]),
      getSemanticBlocksByVisit: vi.fn().mockResolvedValue([])
    }));
    
    // Mock de useUser
    (useUser as unknown as Mock).mockReturnValue({
      user: { id: 'user-123' },
      profile: { full_name: 'Dr. Test' }
    });
    
    // Mock de checkSupabaseConnection
    (checkSupabaseConnection as Mock).mockResolvedValue({ success: true });
  });

  it('muestra todos los bloques del dashboard cuando Supabase está conectado', async () => {
    // Mock de visitas para que haya contenido
    const mockVisits = [
      { id: 'visit-1', patient_id: 'patient-123', date: '2023-01-01', status: 'COMPLETED' },
      { id: 'visit-2', patient_id: 'patient-456', date: '2023-01-05', status: 'IN_PROGRESS' }
    ];
    
    // Configurar el mock para devolver visitas
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockResolvedValue(mockVisits);
    
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    
    // Esperar a que desaparezca el loader y aparezca el contenido
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
    
    // Verificar que se muestran todos los bloques esperados
    expect(screen.getByText('Panel de Control Profesional')).toBeInTheDocument();
    expect(screen.getByText('Visitas totales')).toBeInTheDocument();
    expect(screen.getByText('Evolución de uso (últimas 4 semanas)')).toBeInTheDocument();
    expect(screen.getByText('Visitas recientes')).toBeInTheDocument();
    expect(screen.getByText('Acciones rápidas')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-semantic-memory')).toBeInTheDocument();
  });

  it('maneja correctamente el comportamiento en modo fallback (Supabase desconectado)', async () => {
    // Simular que Supabase está en modo fallback
    (checkSupabaseConnection as Mock).mockResolvedValue({ 
      success: false, 
      error: 'Test error', 
      code: 'TEST_ERROR' 
    });
    
    // Visitas vacías para probar el estado vacío
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockResolvedValue([]);
    
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    
    // Esperar a que desaparezca el loader
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loader')).not.toBeInTheDocument();
    });
    
    // En modo fallback sin visitas, debería mostrar el estado vacío
    expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument();
    expect(screen.getByText('Aún no tienes visitas clínicas')).toBeInTheDocument();
  });

  it('carga datos de memoria semántica correctamente', async () => {
    // Mock de visitas para que haya contenido
    const mockVisits = [
      { id: 'visit-1', patient_id: 'patient-123', date: '2023-01-01', status: 'COMPLETED' }
    ];
    
    // Configurar el mock para devolver visitas
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockResolvedValue(mockVisits);
    
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    
    // Esperar a que se complete la carga
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loader')).not.toBeInTheDocument();
    });
    
    // Verificar que el panel de memoria semántica recibe las props correctas
    expect(screen.getByTestId('dashboard-semantic-memory')).toBeInTheDocument();
    expect(screen.getByText('Memory Panel Mock for user-123')).toBeInTheDocument();
    expect(screen.getByText('Patient: patient-123')).toBeInTheDocument();
  });
}); 