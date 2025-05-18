import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../../features/dashboard/DashboardPage';
import * as UserContext from '../../core/auth/UserContext';
import { User } from '@supabase/supabase-js';
import { visitDataSourceSupabase } from '../../core/dataSources/visitDataSourceSupabase';
import * as AnalyticsService from '../../services/UsageAnalyticsService';
import { Visit, VisitStatus } from '../../core/domain/visitType';

// Mock de dependencias externas
vi.mock('../../core/auth/UserContext', () => ({
  useUser: vi.fn()
}));

vi.mock('../../core/dataSources/visitDataSourceSupabase', () => ({
  visitDataSourceSupabase: {
    getVisitsByProfessionalId: vi.fn()
  }
}));

vi.mock('../../services/UsageAnalyticsService', () => ({
  getMetricsSummaryByVisit: vi.fn(),
  track: vi.fn(),
  logMetric: vi.fn()
}));

vi.mock('react-router-dom', async () => {
  const originalModule = await vi.importActual('react-router-dom');
  return {
    ...(originalModule as object),
    useNavigate: () => vi.fn()
  };
});

// Datos de prueba para mocks
const mockUser = {
  id: 'user-test-789',
  email: 'professional@test.com',
  app_metadata: { role: 'professional' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z'
} as User;

const mockVisits: Visit[] = [
  {
    id: 'visit-test-123',
    professional_id: 'user-test-789',
    patient_id: 'patient-test-456',
    date: '2023-06-01T10:00:00.000Z',
    status: VisitStatus.COMPLETED,
    notes: 'Primera visita',
    created_at: '2023-06-01T09:30:00.000Z',
    updated_at: '2023-06-01T11:00:00.000Z'
  },
  {
    id: 'visit-test-124',
    professional_id: 'user-test-789',
    patient_id: 'patient-test-456',
    date: '2023-06-15T15:00:00.000Z',
    status: VisitStatus.COMPLETED,
    notes: 'Visita de seguimiento',
    created_at: '2023-06-15T14:30:00.000Z',
    updated_at: '2023-06-15T16:00:00.000Z'
  }
];

// Mock de métricas por visita
const mockVisitMetrics = {
  generated: 12,
  accepted: 10,
  integrated: 8,
  field_matched: 6,
  warnings: 1,
  estimated_time_saved_minutes: 24
};

describe('Evaluación de DashboardPage', () => {
  beforeEach(() => {
    // Configurar mocks para cada prueba
    vi.mocked(UserContext.useUser).mockReturnValue({
      user: mockUser,
      profile: {
        id: mockUser.id,
        role: 'professional',
        full_name: 'Dr. Test'
      },
      session: null,
      role: 'professional',
      isLoading: false,
      error: null,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      hasRole: () => true
    });
    
    vi.mocked(visitDataSourceSupabase.getVisitsByProfessionalId).mockResolvedValue(mockVisits);
    
    vi.mocked(AnalyticsService.getMetricsSummaryByVisit).mockReturnValue(mockVisitMetrics);
  });
  
  it('integra correctamente con UsageAnalyticsService para obtener métricas', async () => {
    // Renderizar el componente
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Verificar que se carga correctamente y procesa los datos
    await waitFor(() => {
      // Verificar que se usa el UsageAnalyticsService para obtener métricas
      expect(AnalyticsService.getMetricsSummaryByVisit).toHaveBeenCalled();
      
      // Verificar que muestra datos de actividad
      expect(screen.getByText('Visitas totales')).toBeInTheDocument();
      expect(screen.getByText('Sugerencias integradas')).toBeInTheDocument();
      expect(screen.getByText('Tasa de aceptación')).toBeInTheDocument();
      expect(screen.getByText('Tiempo ahorrado')).toBeInTheDocument();
    });
  });

  it('consulta correctamente a Supabase para cargar las visitas del profesional', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Verificar que se consulta a visitDataSourceSupabase
    await waitFor(() => {
      expect(visitDataSourceSupabase.getVisitsByProfessionalId).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('utiliza el AuthContext para obtener el userId del profesional', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Verificar que se usa el contexto de usuario
    await waitFor(() => {
      expect(UserContext.useUser).toHaveBeenCalled();
      expect(visitDataSourceSupabase.getVisitsByProfessionalId).toHaveBeenCalledWith(mockUser.id);
    });
  });

  it('contiene todos los elementos de UI requeridos para el dashboard', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      // Verificar sección de resumen
      expect(screen.getByText('Panel de Control Profesional')).toBeInTheDocument();
      expect(screen.getByText('Visitas totales')).toBeInTheDocument();
      
      // Verificar gráfica de evolución
      expect(screen.getByText(/Evolución de uso/)).toBeInTheDocument();
      
      // Verificar lista de visitas
      expect(screen.getByText('Visitas recientes')).toBeInTheDocument();
      
      // Verificar botón rápido
      expect(screen.getByText('Nueva visita')).toBeInTheDocument();
    });
  });

  it('maneja correctamente el estado de carga y errores', async () => {
    // Primero probar con un error
    vi.mocked(visitDataSourceSupabase.getVisitsByProfessionalId).mockRejectedValueOnce(new Error('Error al obtener visitas'));
    
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
    
    // Verificar manejo de error
    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos del panel de control/)).toBeInTheDocument();
    });
  });
}); 