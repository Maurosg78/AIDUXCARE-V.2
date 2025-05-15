import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import AgentSuggestionFeedbackActions, { AgentSuggestionFeedback } from '../AgentSuggestionFeedbackActions';
import { AgentSuggestion } from '../../../../core/agent/ClinicalAgent';

describe('AgentSuggestionFeedbackActions', () => {
  // Mock para el console.log para evitar salidas en la consola durante las pruebas
  const originalConsoleLog = console.log;
  beforeEach(() => {
    console.log = vi.fn();
  });
  
  afterEach(() => {
    console.log = originalConsoleLog;
  });
  
  // Datos de prueba: sugerencia ficticia para probar el componente
  const mockSuggestion: AgentSuggestion = {
    id: 'sugg-1',
    sourceBlockId: 'block-1',
    type: 'recommendation',
    content: 'Considerar evaluación de escala de dolor.'
  };

  it('renderiza los tres botones de retroalimentación', () => {
    const mockOnFeedback = vi.fn();
    render(
      <AgentSuggestionFeedbackActions 
        suggestion={mockSuggestion} 
        onFeedback={mockOnFeedback} 
      />
    );
    
    // Verificar que los tres botones están presentes
    expect(screen.getByText('✅ Aceptar')).toBeInTheDocument();
    expect(screen.getByText('❌ Rechazar')).toBeInTheDocument();
    expect(screen.getByText('⏳ Posponer')).toBeInTheDocument();
  });

  it('ejecuta onFeedback con el valor correcto al hacer clic en un botón', () => {
    const mockOnFeedback = vi.fn();
    render(
      <AgentSuggestionFeedbackActions 
        suggestion={mockSuggestion} 
        onFeedback={mockOnFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('✅ Aceptar'));
    
    // Verificar que onFeedback se llamó con el valor correcto
    expect(mockOnFeedback).toHaveBeenCalledWith('accept');
  });

  it('muestra el mensaje en consola con el formato correcto', () => {
    const mockOnFeedback = vi.fn();
    render(
      <AgentSuggestionFeedbackActions 
        suggestion={mockSuggestion} 
        onFeedback={mockOnFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('✅ Aceptar'));
    
    // Verificar que se imprimió el mensaje correcto en la consola
    expect(console.log).toHaveBeenCalledWith('Feedback para sugerencia block-1: accept');
  });

  it('desactiva todos los botones después de seleccionar una opción', () => {
    const mockOnFeedback = vi.fn();
    render(
      <AgentSuggestionFeedbackActions 
        suggestion={mockSuggestion} 
        onFeedback={mockOnFeedback} 
      />
    );
    
    // Hacer clic en el botón de rechazar
    fireEvent.click(screen.getByText('❌ Rechazar'));
    
    // Verificar que todos los botones están desactivados
    expect(screen.getByText('✅ Aceptar')).toBeDisabled();
    expect(screen.getByText('❌ Rechazar')).toBeDisabled();
    expect(screen.getByText('⏳ Posponer')).toBeDisabled();
  });

  it('solo permite una acción por sugerencia', () => {
    const mockOnFeedback = vi.fn();
    render(
      <AgentSuggestionFeedbackActions 
        suggestion={mockSuggestion} 
        onFeedback={mockOnFeedback} 
      />
    );
    
    // Hacer clic en el botón de aceptar
    fireEvent.click(screen.getByText('✅ Aceptar'));
    
    // Intentar hacer clic en otro botón
    fireEvent.click(screen.getByText('❌ Rechazar'));
    
    // Verificar que onFeedback solo se llamó una vez
    expect(mockOnFeedback).toHaveBeenCalledTimes(1);
    expect(mockOnFeedback).toHaveBeenCalledWith('accept');
  });

  it('cambia la apariencia visual del botón seleccionado', () => {
    const mockOnFeedback = vi.fn();
    render(
      <AgentSuggestionFeedbackActions 
        suggestion={mockSuggestion} 
        onFeedback={mockOnFeedback} 
      />
    );
    
    // Hacer clic en el botón de posponer
    fireEvent.click(screen.getByText('⏳ Posponer'));
    
    // Verificar que el botón posponer tiene la clase de seleccionado
    const postponeButton = screen.getByText('⏳ Posponer');
    expect(postponeButton).toHaveClass('bg-yellow-100');
    expect(postponeButton).toHaveClass('text-yellow-800');
    
    // Verificar que los otros botones aparecen como desactivados
    const acceptButton = screen.getByText('✅ Aceptar');
    const rejectButton = screen.getByText('❌ Rechazar');
    
    expect(acceptButton).toHaveClass('opacity-50');
    expect(rejectButton).toHaveClass('opacity-50');
  });
}); 