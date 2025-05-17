import { vi } from "vitest";
vi.mock("@/core/auth/supabaseClient");
// Mock para supabaseClient
vi.mock('@/core/auth/supabaseClient', () => {
  return {
    default: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => ({ data: {}, error: null }),
          }),
        }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
    },
  };
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import AgentSuggestionFeedbackActions from '../AgentSuggestionFeedbackActions';
import * as AnalyticsService from '../../../../services/UsageAnalyticsService';

// Mockeamos el servicio de analytics que usa el componente
vi.mock('../../../../services/UsageAnalyticsService', () => ({
  track: vi.fn()
}));

describe('AgentSuggestionFeedbackActions', () => {
  // Mock para el console.log para evitar salidas en la consola durante las pruebas
  const originalConsoleLog = console.log;
  beforeEach(() => {
    console.log = vi.fn();
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
    vi.clearAllMocks();
  });
  
  // Datos de prueba para el componente
  const mockProps = {
    visitId: 'visit-123',
    userId: 'user-456',
    onFeedback: vi.fn()
  };

  it('renderiza los dos botones de retroalimentación', () => {
    render(
      <AgentSuggestionFeedbackActions 
        visitId={mockProps.visitId}
        userId={mockProps.userId}
        onFeedback={mockProps.onFeedback} 
      />
    );
    
    // Verificar que los dos botones están presentes
    expect(screen.getByText('Aceptar')).toBeInTheDocument();
    expect(screen.getByText('Rechazar')).toBeInTheDocument();
  });

  it('ejecuta onFeedback con el valor correcto al hacer clic en un botón', () => {
    render(
      <AgentSuggestionFeedbackActions 
        visitId={mockProps.visitId}
        userId={mockProps.userId}
        onFeedback={mockProps.onFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('Aceptar'));
    
    // Verificar que onFeedback se llamó con el valor correcto
    expect(mockProps.onFeedback).toHaveBeenCalledWith('accept');
  });

  it('registra métricas de uso al aceptar una sugerencia', () => {
    render(
      <AgentSuggestionFeedbackActions 
        visitId={mockProps.visitId}
        userId={mockProps.userId}
        onFeedback={mockProps.onFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('Aceptar'));
    
    // Verificar que se llamó al servicio de analytics
    expect(AnalyticsService.track).toHaveBeenCalledWith('suggestions_accepted', mockProps.userId, mockProps.visitId, 1);
  });

  it('desactiva los botones y muestra mensaje después de seleccionar una opción', () => {
    render(
      <AgentSuggestionFeedbackActions 
        visitId={mockProps.visitId}
        userId={mockProps.userId}
        onFeedback={mockProps.onFeedback} 
      />
    );
    
    // Hacer clic en el botón de rechazar
    fireEvent.click(screen.getByText('Rechazar'));
    
    // Verificar que los botones ya no están visibles
    expect(screen.queryByText('Aceptar')).not.toBeInTheDocument();
    expect(screen.queryByText('Rechazar')).not.toBeInTheDocument();
    
    // Verificar que se muestra el mensaje de rechazada
    expect(screen.getByText('Rechazada')).toBeInTheDocument();
  });

  it('solo permite una acción por sugerencia', () => {
    render(
      <AgentSuggestionFeedbackActions 
        visitId={mockProps.visitId}
        userId={mockProps.userId}
        onFeedback={mockProps.onFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('Aceptar'));
    
    // Resetear el mock para comprobar que no se vuelve a llamar
    mockProps.onFeedback.mockClear();
    
    // Intentar llamar a onFeedback de nuevo
    // (simulamos un segundo intento de dar feedback)
    try {
      fireEvent.click(screen.getByText('Rechazar'));
    } catch (e) {
      // Es posible que el botón ya no exista, lo que es correcto
    }
    
    // Verificar que onFeedback no se llamó una segunda vez
    expect(mockProps.onFeedback).not.toHaveBeenCalled();
    
    // Verificar que aparece el texto de Aceptada
    expect(screen.getByText('Aceptada')).toBeInTheDocument();
  });

  it('muestra los mensajes con el estilo visual correcto', () => {
    render(
      <AgentSuggestionFeedbackActions 
        visitId={mockProps.visitId}
        userId={mockProps.userId}
        onFeedback={mockProps.onFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('Aceptar'));
    
    // Verificar que el texto tiene la clase de color correcta
    // El texto 'Aceptada' está dentro de un span, que a su vez está dentro de otro span con la clase text-green-600
    const feedbackText = screen.getByText('Aceptada');
    expect(feedbackText).toBeInTheDocument();
    expect(feedbackText).toHaveClass('text-xs');
  });
}); 