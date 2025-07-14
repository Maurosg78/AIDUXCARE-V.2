import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AgentSuggestionMetrics from '../AgentSuggestionMetrics';

describe('AgentSuggestionMetrics', () => {
  const mockMetrics = {
    totalSuggestions: 10,
    acceptedSuggestions: 5,
    rejectedSuggestions: 3,
    pendingSuggestions: 2,
    averageResponseTime: 2.5,
    successRate: 0.8
  };

  it('debe renderizar correctamente las métricas', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} />);

    expect(screen.getByText('Métricas de Sugerencias')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total
    expect(screen.getByText('5')).toBeInTheDocument(); // Aceptadas
    expect(screen.getByText('3')).toBeInTheDocument(); // Rechazadas
    expect(screen.getByText('2')).toBeInTheDocument(); // Pendientes
    expect(screen.getByText('2.5s')).toBeInTheDocument(); // Tiempo de respuesta
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // Tasa de éxito
  });

  it('debe mostrar el estado de carga', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} isLoading={true} />);

    expect(screen.getByText('Cargando métricas...')).toBeInTheDocument();
  });

  it('debe mostrar el estado de error', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} error="Error al cargar métricas" />);

    expect(screen.getByText('Error al cargar métricas')).toBeInTheDocument();
  });

  it('debe tener atributos ARIA correctos', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} />);

    const section = screen.getByLabelText('Métricas de sugerencias');
    expect(section).toBeInTheDocument();

    const metricsList = screen.getByLabelText('Lista de métricas');
    expect(metricsList).toBeInTheDocument();
  });

  it('debe formatear correctamente los porcentajes', () => {
    const metricsWithDifferentRates = {
      ...mockMetrics,
      successRate: 0.1234
    };

    render(<AgentSuggestionMetrics metrics={metricsWithDifferentRates} />);
    expect(screen.getByText('12.3%')).toBeInTheDocument();
  });

  it('debe formatear correctamente los tiempos de respuesta', () => {
    const metricsWithDifferentTimes = {
      ...mockMetrics,
      averageResponseTime: 1.234
    };

    render(<AgentSuggestionMetrics metrics={metricsWithDifferentTimes} />);
    expect(screen.getByText('1.2s')).toBeInTheDocument();
  });

  it('debe manejar métricas con valores cero', () => {
    const zeroMetrics = {
      totalSuggestions: 0,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0,
      pendingSuggestions: 0,
      averageResponseTime: 0,
      successRate: 0
    };

    render(<AgentSuggestionMetrics metrics={zeroMetrics} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4); // 4 métricas con valor 0
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('0.0s')).toBeInTheDocument();
  });
}); 