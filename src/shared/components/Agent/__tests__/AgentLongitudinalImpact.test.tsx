import { vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import AgentLongitudinalImpact from '../AgentLongitudinalImpact';
import * as UsageAnalyticsService from '../../../../services/UsageAnalyticsService';
import { LongitudinalImpactByType } from '../../../../core/types/analytics';

// Mock de las dependencias
vi.mock('../../../../services/UsageAnalyticsService', () => ({
  getLongitudinalImpactByPatient: vi.fn()
}));

describe('AgentLongitudinalImpact', () => {
  // Mock de datos para las pruebas
  const mockImpactData: LongitudinalImpactByType[] = [
    {
      type: 'recommendation',
      totalGenerated: 42,
      totalAccepted: 36,
      totalTimeSavedMinutes: 108,
      acceptanceRate: 86,
      visitCount: 7
    },
    {
      type: 'warning',
      totalGenerated: 15,
      totalAccepted: 10,
      totalTimeSavedMinutes: 30,
      acceptanceRate: 67,
      visitCount: 5
    },
    {
      type: 'info',
      totalGenerated: 23,
      totalAccepted: 18,
      totalTimeSavedMinutes: 54,
      acceptanceRate: 78,
      visitCount: 6
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Por defecto, devolver datos de impacto para las pruebas
    vi.mocked(UsageAnalyticsService.getLongitudinalImpactByPatient).mockResolvedValue(mockImpactData);
  });

  test('muestra correctamente los datos de impacto longitudinal', async () => {
    render(<AgentLongitudinalImpact patientId="patient-123" />);
    
    // Verificar que inicialmente se muestra el indicador de carga
    expect(screen.getByText('Cargando métricas longitudinales...')).toBeInTheDocument();
    
    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByTestId('agent-longitudinal-impact')).toBeInTheDocument();
    });
    
    // Verificar que se llama al servicio con el ID del paciente correcto
    expect(UsageAnalyticsService.getLongitudinalImpactByPatient).toHaveBeenCalledWith('patient-123');
    
    // Verificar que se muestran las tarjetas para los tres tipos
    expect(screen.getByTestId('impact-card-recommendation')).toBeInTheDocument();
    expect(screen.getByTestId('impact-card-warning')).toBeInTheDocument();
    expect(screen.getByTestId('impact-card-info')).toBeInTheDocument();
    
    // Verificar que se muestran los datos correctos para recomendaciones
    const recommendationCard = screen.getByTestId('impact-card-recommendation');
    expect(recommendationCard).toHaveTextContent('Recomendaciones');
    expect(recommendationCard).toHaveTextContent('42'); // totalGenerated
    expect(recommendationCard).toHaveTextContent('36'); // totalAccepted
    expect(recommendationCard).toHaveTextContent('86%'); // acceptanceRate
    expect(recommendationCard).toHaveTextContent('108 min'); // totalTimeSavedMinutes
    expect(recommendationCard).toHaveTextContent('7 visitas'); // visitCount
    
    // Verificar que existen las barras de progreso
    expect(screen.getByTestId('acceptance-bar-recommendation')).toBeInTheDocument();
    expect(screen.getByTestId('time-bar-recommendation')).toBeInTheDocument();
  });

  test('muestra mensaje cuando no hay datos de impacto', async () => {
    // Mockear para que no devuelva datos
    vi.mocked(UsageAnalyticsService.getLongitudinalImpactByPatient).mockResolvedValue([]);
    
    render(<AgentLongitudinalImpact patientId="patient-123" />);
    
    // Esperar a que se muestre el mensaje de no hay datos
    await waitFor(() => {
      expect(screen.getByTestId('no-impact-data')).toBeInTheDocument();
      expect(screen.getByText('No hay métricas acumuladas disponibles para este paciente.')).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error cuando falla la carga de datos', async () => {
    // Mockear para que arroje un error
    vi.mocked(UsageAnalyticsService.getLongitudinalImpactByPatient).mockRejectedValue(new Error('Error de prueba'));
    
    render(<AgentLongitudinalImpact patientId="patient-123" />);
    
    // Esperar a que se muestre el mensaje de error
    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las métricas acumuladas')).toBeInTheDocument();
    });
  });
}); 