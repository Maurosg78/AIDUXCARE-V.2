import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import * as UserContext from '../../../core/auth/UserContext';
import { visitDataSourceSupabase } from '../../../core/dataSources/visitDataSourceSupabase';
import * as dashboardServices from '../dashboardServices';
import { User } from '@supabase/supabase-js';
import { Visit, VisitStatus } from '../../../core/domain/visitType';

// Mock de react-router-dom
vi.mock('react-router-dom', async () => {
  const originalModule = await vi.importActual('react-router-dom');
  return {
    ...(originalModule as object),
    useNavigate: () => vi.fn()
  };
});

// Mock del contexto de usuario
vi.mock('../../../core/auth/UserContext', () => ({
  useUser: vi.fn()
}));

// Mock de los servicios de dashboard
vi.mock('../dashboardServices', () => ({
  getProfessionalActivitySummary: vi.fn(),
  getWeeklyMetrics: vi.fn(),
  getLongitudinalMetricsByProfessional: vi.fn()
}));

// Mock del servicio de datos de visitas
vi.mock('../../../core/dataSources/visitDataSourceSupabase', () => ({
  visitDataSourceSupabase: {
    getVisitsByProfessionalId: vi.fn()
  }
}));

// Datos de prueba
const mockUser = {
  id: 'user-test-123',
  email: 'doctor@example.com',
  app_metadata: { role: 'professional' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z'
} as User;

const mockProfile = {
  id: 'user-test-123',
  role: 'professional',
  full_name: 'Dr. Test User'
};

const mockVisits: Visit[] = [
  {
    id: 'visit-1',
    patient_id: 'patient-1',
    professional_id: 'user-test-123',
    date: '2023-05-15T10:00:00Z',
    status: VisitStatus.COMPLETED,
    notes: 'Test notes',
    created_at: '2023-05-15T09:30:00Z',
    updated_at: '2023-05-15T11:30:00Z'
  },
  {
    id: 'visit-2',
    patient_id: 'patient-2',
    professional_id: 'user-test-123',
    date: '2023-05-16T14:30:00Z',
    status: VisitStatus.IN_PROGRESS,
    notes: 'In progress notes',
    created_at: '2023-05-16T14:00:00Z',
    updated_at: '2023-05-16T14:30:00Z'
  }
];

const mockActivitySummary = {
  totalVisits: 24,
  suggestionsGenerated: 120,
  suggestionsAccepted: 96,
  suggestionsIntegrated: 84,
  timeSavedMinutes: 252
};

const mockWeeklyMetrics = [
  { week: 'Semana 1', visits: 5, suggestionsGenerated: 25, suggestionsAccepted: 20 },
  { week: 'Semana 2', visits: 6, suggestionsGenerated: 30, suggestionsAccepted: 24 },
  { week: 'Semana 3', visits: 7, suggestionsGenerated: 35, suggestionsAccepted: 28 },
  { week: 'Semana 4', visits: 6, suggestionsGenerated: 30, suggestionsAccepted: 24 }
];

describe('DashboardPage Component', () => {
  beforeEach(() => {
    // Configurar mocks antes de cada prueba
    vi.mocked(UserContext.useUser).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      session: null,
      role: 'professional',
      isLoading: false,
      error: null,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      hasRole: () => true
    });
    
    vi.mocked(visitDataSourceSupabase.getVisitsByProfessionalId).mockResolvedValue(mockVisits);
    vi.mocked(dashboardServices.getProfessionalActivitySummary).mockResolvedValue(mockActivitySummary);
    vi.mocked(dashboardServices.getWeeklyMetrics).mockResolvedValue(mockWeeklyMetrics);
  });
  
  it('renderiza el componente correctamente y muestra estado de carga', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Verificar título
    expect(screen.getByText('Panel de Control Profesional')).toBeInTheDocument();
    
    // Durante la carga inicial debería mostrar un spinner
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('muestra el resumen de actividad después de cargar los datos', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText('24')).toBeInTheDocument(); // Total de visitas
    });
    
    // Verificar que muestra los datos del resumen
    expect(screen.getByText('Visitas totales')).toBeInTheDocument();
    expect(screen.getByText('Sugerencias integradas')).toBeInTheDocument();
    expect(screen.getByText('Tasa de aceptación')).toBeInTheDocument();
    expect(screen.getByText('Tiempo ahorrado')).toBeInTheDocument();
    
    // Verificar valores específicos
    expect(screen.getByText('84')).toBeInTheDocument(); // Sugerencias integradas
    expect(screen.getByText('80%')).toBeInTheDocument(); // Tasa de aceptación (96/120 = 80%)
    expect(screen.getByText('4h 12m')).toBeInTheDocument(); // Tiempo ahorrado (252 minutos)
  });
  
  it('muestra la lista de visitas recientes', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText('Visitas recientes')).toBeInTheDocument();
    });
    
    // Verificar que muestra las visitas
    expect(screen.getByText('Paciente 1')).toBeInTheDocument();
    expect(screen.getByText('Paciente 2')).toBeInTheDocument();
    expect(screen.getByText(VisitStatus.COMPLETED)).toBeInTheDocument();
    expect(screen.getByText(VisitStatus.IN_PROGRESS)).toBeInTheDocument();
  });
  
  it('muestra el gráfico de evolución semanal', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText('Evolución de uso (últimas 4 semanas)')).toBeInTheDocument();
    });
  });
  
  it('muestra el botón de nueva visita', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText('Nueva visita')).toBeInTheDocument();
    });
    
    // Verificar el botón
    const newVisitButton = screen.getByText('Nueva visita');
    expect(newVisitButton).toBeInTheDocument();
    
    // Simular click en el botón
    fireEvent.click(newVisitButton);
    // No podemos verificar la navegación directamente porque useNavigate es un mock
  });
  
  it('maneja errores de carga correctamente', async () => {
    // Configurar mock para provocar un error
    vi.mocked(dashboardServices.getProfessionalActivitySummary).mockRejectedValueOnce(new Error('Error de prueba'));
    
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Esperar a que se muestre el mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos del panel de control/)).toBeInTheDocument();
    });
  });
}); 