// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import AgentSuggestionMetrics from '../AgentSuggestionMetrics';

// Limpieza tras cada test
afterEach(() => {
  cleanup();
});

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
    // Usar exist y getAllByText para valores duplicados
    expect(screen.getByText('Métricas de Sugerencias')).to.exist;
    expect(screen.getAllByText('10')[0]).to.exist; // Total
    expect(screen.getAllByText('5')[0]).to.exist; // Aceptadas
    expect(screen.getAllByText('3')[0]).to.exist; // Rechazadas
    expect(screen.getAllByText('2')[0]).to.exist; // Pendientes
    expect(screen.getByText('2.5s')).to.exist; // Tiempo de respuesta
    expect(screen.getByText('80.0%')).to.exist; // Tasa de éxito
  });

  it('debe mostrar el estado de carga', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} isLoading={true} />);
    expect(screen.getByText('Cargando métricas...')).to.exist;
  });

  it('debe mostrar el estado de error', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} error="Error al cargar métricas" />);
    expect(screen.getByText('Error al cargar métricas')).to.exist;
  });

  it('debe tener atributos ARIA correctos', () => {
    render(<AgentSuggestionMetrics metrics={mockMetrics} />);
    const section = screen.getByLabelText('Métricas de sugerencias');
    expect(section).to.exist;
    const metricsList = screen.getByLabelText('Lista de métricas');
    expect(metricsList).to.exist;
  });

  it('debe formatear correctamente los porcentajes', () => {
    const metricsWithDifferentRates = {
      ...mockMetrics,
      successRate: 0.1234
    };
    render(<AgentSuggestionMetrics metrics={metricsWithDifferentRates} />);
    expect(screen.getByText('12.3%')).to.exist;
  });

  it('debe formatear correctamente los tiempos de respuesta', () => {
    const metricsWithDifferentTimes = {
      ...mockMetrics,
      averageResponseTime: 1.234
    };
    render(<AgentSuggestionMetrics metrics={metricsWithDifferentTimes} />);
    expect(screen.getByText('1.2s')).to.exist;
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
    expect(zeroElements.length).to.equal(4); // 4 métricas con valor 0
    expect(screen.getByText('0.0%')).to.exist;
    expect(screen.getByText('0.0s')).to.exist;
  });
}); 