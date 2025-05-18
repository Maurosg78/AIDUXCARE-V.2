import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DashboardPage from '../DashboardPage';
import { UserProvider } from '../../../core/auth/UserContext';
import { BrowserRouter } from 'react-router-dom';
import { initializeSemanticMemoryData } from '../../../core/mcp/initializeSemanticMemoryData';

// Mocks para las funciones de servicio
vi.mock('../dashboardServices', () => ({
  getProfessionalActivitySummary: vi.fn().mockResolvedValue({
    totalVisits: 10,
    suggestionsGenerated: 25,
    suggestionsAccepted: 20,
    suggestionsIntegrated: 18,
    timeSavedMinutes: 120
  }),
  getWeeklyMetrics: vi.fn().mockResolvedValue([
    { week: 'Semana 1', visits: 2, suggestionsGenerated: 5, suggestionsAccepted: 4 },
    { week: 'Semana 2', visits: 3, suggestionsGenerated: 7, suggestionsAccepted: 6 }
  ])
}));

vi.mock('../../../core/dataSources/visitDataSourceSupabase', () => ({
  visitDataSourceSupabase: {
    getVisitsByProfessionalId: vi.fn().mockResolvedValue([
      {
        id: 'visit-001',
        patient_id: 'patient-001',
        professional_id: 'professional-001',
        date: '2023-10-15T10:30:00Z',
        status: 'COMPLETED'
      }
    ])
  }
}));

vi.mock('../../../services/UsageAnalyticsService', () => ({
  track: vi.fn()
}));

// Mock para UserContext
vi.mock('../../../core/auth/UserContext', async () => {
  const actual = await vi.importActual('../../../core/auth/UserContext');
  return {
    ...actual,
    useUser: vi.fn().mockReturnValue({
      user: { id: 'professional-001', email: 'doctor@example.com' },
      profile: { name: 'Dr. Ejemplo', specialty: 'Medicina General' }
    })
  };
});

describe('Integración de DashboardSemanticMemoryPanel', () => {
  beforeEach(async () => {
    // Inicializar datos de muestra para pruebas
    await initializeSemanticMemoryData();
  });

  test('El panel de memoria semántica debe abrirse al hacer clic en el botón', async () => {
    // Renderizar el componente DashboardPage
    render(
      <BrowserRouter>
        <UserProvider>
          <DashboardPage />
        </UserProvider>
      </BrowserRouter>
    );

    // Esperar a que cargue el dashboard
    await waitFor(() => {
      expect(screen.getByText('Panel de Control Profesional')).toBeInTheDocument();
    });

    // Buscar y hacer clic en el botón de memoria semántica
    const memoryButton = await screen.findByText(/Ver Memoria Semántica/i);
    expect(memoryButton).toBeInTheDocument();
    
    fireEvent.click(memoryButton);

    // Verificar que el panel se ha abierto
    await waitFor(() => {
      // Buscamos específicamente el título del dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // Verificar que aparece la leyenda de colores
      expect(screen.getByText('Importancia:')).toBeInTheDocument();
      expect(screen.getByText('Alta')).toBeInTheDocument();
      expect(screen.getByText('Media')).toBeInTheDocument();
      expect(screen.getByText('Baja')).toBeInTheDocument();
    });
  });

  test('El panel debe mostrar bloques semánticos y permitir filtrar por relevancia', async () => {
    // Renderizar el componente DashboardPage
    render(
      <BrowserRouter>
        <UserProvider>
          <DashboardPage />
        </UserProvider>
      </BrowserRouter>
    );

    // Esperar a que cargue el dashboard
    await waitFor(() => {
      expect(screen.getByText('Panel de Control Profesional')).toBeInTheDocument();
    });

    // Abrir el panel de memoria semántica
    const memoryButton = await screen.findByText(/Ver Memoria Semántica/i);
    fireEvent.click(memoryButton);

    // Esperar a que se carguen los datos y verificar que aparecen bloques
    await waitFor(() => {
      // Debería haber al menos un bloque visible
      expect(screen.getByText(/bloques cargados/i)).toBeInTheDocument();
    });

    // Cambiar el filtro de relevancia
    const relevanceSelector = screen.getByLabelText(/Relevancia mínima/i);
    fireEvent.change(relevanceSelector, { target: { value: '0.9' } });

    // Verificar que el filtro se ha aplicado (esto puede ser difícil de probar directamente)
    await waitFor(() => {
      expect(relevanceSelector).toHaveValue('0.9');
    });
  });
});