import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import DashboardPage from '../DashboardPage';
import { visitDataSourceSupabase } from '../../../core/dataSources/visitDataSourceSupabase';
import { useUser } from '../../../core/auth/UserContext';
import { MemoryRouter } from 'react-router-dom';
import { VisitStatus } from '../../../core/domain/visitType';

// Tipo para el mock de useUser
interface MockUserHook {
  user: { id: string };
  profile: Record<string, unknown>;
}

// Tipo para el mock de visitas
interface MockVisit {
  id: string;
  patient_id: string;
  date: string;
  status: string;
}

// Mock de useUser
vi.mock('../../../core/auth/UserContext', () => ({
  useUser: vi.fn()
}));

// Mock de servicios
vi.mock('../../../core/dataSources/visitDataSourceSupabase', () => ({
  visitDataSourceSupabase: {
    getVisitsByProfessionalId: vi.fn()
  }
}));

vi.mock('../dashboardServices', () => ({
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

vi.mock('../DashboardSemanticMemoryPanel', () => ({
  default: () => <div data-testid="dashboard-semantic-memory">Memory Panel Mock</div>
}));

// Contenedor para el componente con Router
const DashboardPageWithRouter = () => (
  <MemoryRouter>
    <DashboardPage />
  </MemoryRouter>
);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el loader mientras carga los datos', async () => {
    // Configurar el mock de useUser para devolver un usuario
    (useUser as unknown as Mock<[], MockUserHook>).mockReturnValue({
      user: { id: 'user-123' },
      profile: {}
    });

    // Simular una carga de datos que tarda
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockReturnValue(
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<DashboardPageWithRouter />);
    
    // Verificar que el loader esté visible
    expect(screen.getByTestId('dashboard-loader')).toBeInTheDocument();
  });

  it('muestra el contenido del dashboard cuando hay visitas', async () => {
    // Configurar el mock de useUser para devolver un usuario
    (useUser as unknown as Mock<[], MockUserHook>).mockReturnValue({
      user: { id: 'user-123' },
      profile: {}
    });

    // Mock de visitas
    const mockVisits: MockVisit[] = [
      { id: 'visit-1', patient_id: 'patient-123', date: '2023-01-01', status: VisitStatus.COMPLETED },
      { id: 'visit-2', patient_id: 'patient-456', date: '2023-01-05', status: VisitStatus.IN_PROGRESS }
    ];

    // Configurar el mock para devolver visitas
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockResolvedValue(mockVisits);

    render(<DashboardPageWithRouter />);
    
    // Esperar a que desaparezca el loader y aparezca el contenido
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    // Verificar que aparezcan elementos clave del dashboard
    expect(screen.getByText('Panel de Control Profesional')).toBeInTheDocument();
    expect(screen.getByText('Visitas totales')).toBeInTheDocument();
    expect(screen.getByText('Visitas recientes')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay visitas', async () => {
    // Configurar el mock de useUser para devolver un usuario
    (useUser as unknown as Mock<[], MockUserHook>).mockReturnValue({
      user: { id: 'user-123' },
      profile: {}
    });

    // Configurar el mock para devolver un array vacío de visitas
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockResolvedValue([]);

    render(<DashboardPageWithRouter />);
    
    // Esperar a que desaparezca el loader y aparezca el estado vacío
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument();
    });

    // Verificar el mensaje de estado vacío
    expect(screen.getByText('Aún no tienes visitas clínicas')).toBeInTheDocument();
    expect(screen.getByText('Crea tu primera visita para comenzar a generar sugerencias clínicas con AiDuxCare.')).toBeInTheDocument();
    expect(screen.getByText('Nueva visita')).toBeInTheDocument();
  });

  it('maneja correctamente errores en la carga de datos', async () => {
    // Configurar el mock de useUser para devolver un usuario
    (useUser as unknown as Mock<[], MockUserHook>).mockReturnValue({
      user: { id: 'user-123' },
      profile: {}
    });

    // Simular un error en la carga de visitas
    const errorMessage = 'Error al cargar visitas';
    (visitDataSourceSupabase.getVisitsByProfessionalId as Mock).mockRejectedValue(new Error(errorMessage));

    render(<DashboardPageWithRouter />);
    
    // Esperar a que desaparezca el loader y aparezca el mensaje de error
    await waitFor(() => {
      expect(screen.queryByTestId('dashboard-loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('dashboard-error')).toBeInTheDocument();
    });

    // Verificar que el mensaje de error contenga el texto esperado
    expect(screen.getByTestId('dashboard-error')).toHaveTextContent(errorMessage);
  });
}); 